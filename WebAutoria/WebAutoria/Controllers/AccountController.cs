using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using System;
using System.Data;
using System.Net.Http;
using System.Security.Claims;
using WebAutoria.Data.Entities.Identity;
using WebAutoria.Models.Account;
using WebAutoria.Services;
using static System.Net.Mime.MediaTypeNames;

namespace WebAutoria.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountController(
    UserManager<UserEntity> userManager,
    SignInManager<UserEntity> signInManager,
    TokenService tokenService,
    IWebHostEnvironment env,
    IHttpClientFactory httpClientFactory) : ControllerBase
{
    private readonly IWebHostEnvironment _env = env;
    private readonly IHttpClientFactory _http = httpClientFactory;
    // ===================== Google OAuth flow =====================
    [HttpGet("external-login/google")]
    [AllowAnonymous]
    public IActionResult ExternalLoginGoogle([FromQuery] string? returnUrl = null)
    {
        var redirectUrl = Url.Action(nameof(ExternalLoginCallback), "Account", new { returnUrl }, Request.Scheme)!;
        var props = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("external-login-callback")]
    [AllowAnonymous]
    public async Task<IActionResult> ExternalLoginCallback([FromQuery] string? returnUrl = null)
    {
        var authResult = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
        if (authResult?.Succeeded != true || authResult.Principal == null)
            return BadRequest("Google authentication failed.");

        var principal = authResult.Principal;
        var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        var firstName = principal.FindFirst(ClaimTypes.GivenName)?.Value;
        var lastName = principal.FindFirst(ClaimTypes.Surname)?.Value;
        var providerKey = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value; // Google sub
        var pictureUrl = principal.FindFirst("picture")?.Value
            ?? principal.FindFirst("urn:google:picture")?.Value;


        if (string.IsNullOrEmpty(email))
            return BadRequest("Email is required from Google.");

        // створюємо/знаходимо користувача
        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new UserEntity
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                FirstName = firstName ?? "Google",
                LastName = lastName ?? "User",
                RegistrationDate = DateTime.UtcNow,
                IsConfirmed = true
            };
            var result = await userManager.CreateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);
        }


        // прив'язуємо Google-логін (AspNetUserLogins)
        var logins = await userManager.GetLoginsAsync(user);
        if (!logins.Any(l => l.LoginProvider == "Google") && !string.IsNullOrEmpty(providerKey))
        {
            var info = new UserLoginInfo("Google", providerKey, "Google");
            var addLoginRes = await userManager.AddLoginAsync(user, info);
            if (!addLoginRes.Succeeded)
                return BadRequest(addLoginRes.Errors);
        }
        // ---------- АВАТАР: скачуємо та кладемо у wwwroot/avatars ----------
        if (!string.IsNullOrWhiteSpace(pictureUrl))
        {
            var localPath = await DownloadAndSaveAvatarAsync(pictureUrl, user.Id);
            if (!string.IsNullOrEmpty(localPath))
            {
                // збережемо локальний шлях як клейм "avatar"
                var claims = await userManager.GetClaimsAsync(user);
                var old = claims.FirstOrDefault(c => c.Type == "avatar");
                if (old != null) await userManager.RemoveClaimAsync(user, old);
                await userManager.AddClaimAsync(user, new Claim("avatar", localPath));

                // (опційно) якщо у вашій UserEntity є властивість для фото – розкоментуйте:
                // user.AvatarUrl = localPath;   // <- підставте вашу назву поля
                // await userManager.UpdateAsync(user);
            }
        }
        // видаємо JWT
        var roles = await userManager.GetRolesAsync(user);
        var token = tokenService.GenerateToken(user, roles);
        // варіант 1: редірект на фронт з токеном
        if (!string.IsNullOrWhiteSpace(returnUrl))
        {
            var url = QueryHelpers.AddQueryString(returnUrl, "token", token);
            return Redirect(url);
        }
        // варіант 2: просто JSON (зручно для Postman/мобільних)
        return Ok(new { token });
    }
    /// <summary>
    /// Скачати аватар за URL та зберегти в wwwroot/avatars/{userId}_{guid}.{ext}
    /// Повертає відносний шлях типу "/avatars/xxxxx.jpg" або null при збої.
    /// </summary>
    private async Task<string?> DownloadAndSaveAvatarAsync(string url, long userId)
    {
        try
        {
            var client = _http.CreateClient();
            using var resp = await client.GetAsync(url);
            if (!resp.IsSuccessStatusCode) return null;

            var contentType = resp.Content.Headers.ContentType?.MediaType?.ToLowerInvariant();
            var ext = contentType switch
            {
                "image/jpeg" or "image/jpg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => ".jpg" // дефолт
            };

            // Папка wwwroot/avatars
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var dir = Path.Combine(webRoot, "avatars");
            Directory.CreateDirectory(dir);

            var fileName = $"{userId}_{Guid.NewGuid():N}{ext}";
            var absPath = Path.Combine(dir, fileName);

            await using (var fs = System.IO.File.Create(absPath))
                await resp.Content.CopyToAsync(fs);

            // Відносний шлях, яким можна віддавати файл через StaticFiles
            return $"/avatars/{fileName}";
        }
        catch
        {
            return null;
        }
    }

    [HttpPost("register")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Register([FromForm] RegisterModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new UserEntity
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            Region = model.Region,
            CityOrVillage = model.CityOrVillage,
            PhoneNumber = model.PhoneNumber,
            RegistrationDate = DateTime.UtcNow.AddHours(3), // Зберігаємо у UTC!
            ProfilePhoto = model.ProfilePhotoPath
        };

        var result = await userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);
        await userManager.AddToRoleAsync(user, "User");

        // Якщо є завантажене фото
        if (model.ImageFile is not null && model.ImageFile.Length > 0)
        {
            var uploads = Path.Combine(_env.WebRootPath ?? "wwwroot", "avatars");
            Directory.CreateDirectory(uploads);

            var fileName = $"{user.Id}_{Path.GetFileName(model.ImageFile.FileName)}";
            var filePath = Path.Combine(uploads, fileName);
            using var fs = System.IO.File.Create(filePath);
            await model.ImageFile.CopyToAsync(fs);

            user.ProfilePhoto = $"/avatars/{fileName}";
            await userManager.UpdateAsync(user);
        }

        var roles = await userManager.GetRolesAsync(user);
        var token = tokenService.GenerateToken(user, roles);
        return Ok(new { token });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await userManager.FindByEmailAsync(model.Email);
        if (user == null) return Unauthorized();

        var signIn = await signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: false);
        if (!signIn.Succeeded) return Unauthorized();

        var roles = await userManager.GetRolesAsync(user);
        var token = tokenService.GenerateToken(user, roles);

        return Ok(new { token });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound();

        var roles = await userManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            roles
        });
    }

    [Authorize]
    [HttpDelete("delete")]
    public async Task<IActionResult> DeleteSelf()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound("User not found.");

        var result = await userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok("User deleted.");
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("assign-role")]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleModel model)
    {
        var user = await userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return NotFound($"User with email {model.Email} not found.");

        if (!await signInManager.UserManager.IsInRoleAsync(user, model.Role))
        {
            var result = await userManager.AddToRoleAsync(user, model.Role);
            if (!result.Succeeded)
                return BadRequest(result.Errors);
        }

        return Ok($"Role '{model.Role}' assigned to user {model.Email}.");
    }

    [HttpPost("create-user")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] RegisterModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new UserEntity
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            Region = model.Region,
            CityOrVillage = model.CityOrVillage,
            PhoneNumber = model.PhoneNumber,
            RegistrationDate = DateTime.UtcNow,
            IsConfirmed = true
        };

        var result = await userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // Присвоюємо роль (перевіряємо, чи це валідна роль: "User" або "Admin")
        var validRoles = new[] { "User", "Admin" };
        if (!validRoles.Contains(model.Role))
            return BadRequest("Invalid role. Allowed: User or Admin.");

        await userManager.AddToRoleAsync(user, model.Role);

        return Ok(new { user.Id, user.Email, Message = "User created successfully." });
    }

    [HttpPut("update-user/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(long id, [FromBody] UpdateUserModel model)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return NotFound($"User with ID {id} not found.");

        user.FirstName = model.FirstName ?? user.FirstName;
        user.LastName = model.LastName ?? user.LastName;
        user.Email = model.Email ?? user.Email;
        user.Region = model.Region ?? user.Region;
        user.CityOrVillage = model.CityOrVillage ?? user.CityOrVillage;
        user.PhoneNumber = model.PhoneNumber ?? user.PhoneNumber;
        user.IsConfirmed = model.IsConfirmed ?? user.IsConfirmed;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // Зміна ролі, якщо вказано
        if (!string.IsNullOrEmpty(model.Role))
        {
            var validRoles = new[] { "User", "Admin" };
            if (!validRoles.Contains(model.Role))
                return BadRequest("Invalid role. Allowed: User or Admin.");

            var currentRoles = await userManager.GetRolesAsync(user);
            foreach (var role in currentRoles)
            {
                await userManager.RemoveFromRoleAsync(user, role);
            }
            await userManager.AddToRoleAsync(user, model.Role);
        }

        return Ok(new { user.Id, user.Email, Message = "User updated successfully." });
    }

    [HttpDelete("delete-user/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(long id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return NotFound($"User with ID {id} not found.");

        var result = await userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { Message = "User deleted successfully." });
    }
}
