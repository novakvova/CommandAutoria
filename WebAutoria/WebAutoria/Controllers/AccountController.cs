using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using WebAutoria.Data.Entities.Identity;
using WebAutoria.Models;
using WebAutoria.Models.Account;
using WebAutoria.Services;
using WebAutoria.Services.Interfaces;
using IEmailSender = WebAutoria.Services.Interfaces.IEmailSender;

namespace WebAutoria.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountController(
    UserManager<UserEntity> userManager,
    SignInManager<UserEntity> signInManager,
    TokenService tokenService,
    IWebHostEnvironment env,
    IHttpClientFactory httpClientFactory,
    IEmailSender emailSender,
    IConfiguration configuration
) : ControllerBase
{
    private readonly UserManager<UserEntity> _userManager = userManager;
    private readonly SignInManager<UserEntity> _signInManager = signInManager;
    private readonly TokenService _tokenService = tokenService;
    private readonly IWebHostEnvironment _env = env;
    private readonly IHttpClientFactory _http = httpClientFactory;
    private readonly IEmailSender _emailSender = emailSender;
    private readonly IConfiguration _config = configuration;

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
        var user = await _userManager.FindByEmailAsync(email);
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
            var createRes = await _userManager.CreateAsync(user);
            if (!createRes.Succeeded)
                return BadRequest(createRes.Errors);
        }

        // прив'язуємо Google-логін (AspNetUserLogins)
        var logins = await _userManager.GetLoginsAsync(user);
        if (!logins.Any(l => l.LoginProvider == "Google") && !string.IsNullOrEmpty(providerKey))
        {
            var info = new UserLoginInfo("Google", providerKey, "Google");
            var addLoginRes = await _userManager.AddLoginAsync(user, info);
            if (!addLoginRes.Succeeded)
                return BadRequest(addLoginRes.Errors);
        }

        // ---------- АВАТАР: скачуємо та кладемо у wwwroot/avatars ----------
        if (!string.IsNullOrWhiteSpace(pictureUrl))
        {
            var localPath = await DownloadAndSaveAvatarAsync(pictureUrl, user.Id);
            if (!string.IsNullOrEmpty(localPath))
            {
                // клейм "avatar"
                var claims = await _userManager.GetClaimsAsync(user);
                var old = claims.FirstOrDefault(c => c.Type == "avatar");
                if (old != null) await _userManager.RemoveClaimAsync(user, old);
                await _userManager.AddClaimAsync(user, new Claim("avatar", localPath));

                // поле користувача для фронта
                user.ProfilePhoto = localPath;
                await _userManager.UpdateAsync(user);
            }
        }

        // видаємо JWT
        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

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

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var dir = Path.Combine(webRoot, "avatars");
            Directory.CreateDirectory(dir);

            var fileName = $"{userId}_{Guid.NewGuid():N}{ext}";
            var absPath = Path.Combine(dir, fileName);

            await using (var fs = System.IO.File.Create(absPath))
                await resp.Content.CopyToAsync(fs);

            return $"/avatars/{fileName}";
        }
        catch
        {
            return null;
        }
    }

    // ===================== Email/Password реєстрація-логін =====================
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
            RegistrationDate = DateTime.UtcNow, // краще зберігати в UTC
            ProfilePhoto = model.ProfilePhotoPath
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, "User");

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
            await _userManager.UpdateAsync(user);
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);
        return Ok(new { token });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) return Unauthorized();

        var signIn = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: false);
        if (!signIn.Succeeded) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        var token = _tokenService.GenerateToken(user, roles);

        return Ok(new { token });
    }

    // ===================== Профіль =====================
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Region,
            user.CityOrVillage,
            user.PhoneNumber,
            user.ProfilePhoto,
            user.RegistrationDate,
            roles
        });
    }

    // ===================== Адмін / сервісні =====================
    [Authorize]
    [HttpDelete("delete")]
    public async Task<IActionResult> DeleteSelf()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound("User not found.");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok("User deleted.");
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("assign-role")]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return NotFound($"User with email {model.Email} not found.");

        if (!await _signInManager.UserManager.IsInRoleAsync(user, model.Role))
        {
            var res = await _userManager.AddToRoleAsync(user, model.Role);
            if (!res.Succeeded)
                return BadRequest(res.Errors);
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

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        var validRoles = new[] { "User", "Admin" };
        if (!validRoles.Contains(model.Role))
            return BadRequest("Invalid role. Allowed: User or Admin.");

        await _userManager.AddToRoleAsync(user, model.Role);

        return Ok(new { user.Id, user.Email, Message = "User created successfully." });
    }

    [HttpPut("update-user/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(long id, [FromBody] UpdateUserModel model)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return NotFound($"User with ID {id} not found.");

        user.FirstName = model.FirstName ?? user.FirstName;
        user.LastName = model.LastName ?? user.LastName;
        user.Email = model.Email ?? user.Email;
        user.Region = model.Region ?? user.Region;
        user.CityOrVillage = model.CityOrVillage ?? user.CityOrVillage;
        user.PhoneNumber = model.PhoneNumber ?? user.PhoneNumber;
        user.IsConfirmed = model.IsConfirmed ?? user.IsConfirmed;

        var res = await _userManager.UpdateAsync(user);
        if (!res.Succeeded)
            return BadRequest(res.Errors);

        if (!string.IsNullOrEmpty(model.Role))
        {
            var validRoles = new[] { "User", "Admin" };
            if (!validRoles.Contains(model.Role))
                return BadRequest("Invalid role. Allowed: User or Admin.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            foreach (var role in currentRoles)
                await _userManager.RemoveFromRoleAsync(user, role);

            await _userManager.AddToRoleAsync(user, model.Role);
        }

        return Ok(new { user.Id, user.Email, Message = "User updated successfully." });
    }

    [HttpDelete("delete-user/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(long id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return NotFound($"User with ID {id} not found.");

        var res = await _userManager.DeleteAsync(user);
        if (!res.Succeeded)
            return BadRequest(res.Errors);

        return Ok(new { Message = "User deleted successfully." });
    }

    // ===================== Відновлення паролю =====================
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) return Ok(); // не розкриваємо, чи існує користувач

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        // Кодуємо токен для URL (бо містить + / =)
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        // Посилання на фронт (SPA)
        var frontendBase = _config["Frontend:BaseUrl"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";
        var callbackUrl = $"{frontendBase}/reset-password?token={encodedToken}&email={Uri.EscapeDataString(user.Email!)}";

        await _emailSender.SendEmailAsync(
            user.Email!,
            "Відновлення паролю",
            $"Для скидання паролю перейдіть за <a href='{callbackUrl}'>цим посиланням</a>."
        );

        return Ok(new { message = "Інструкція відправлена" });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) return BadRequest("Користувача не знайдено");

        // Декодуємо, якщо прийшов Base64Url токен із фронта
        string tokenToUse;
        try
        {
            var tokenBytes = WebEncoders.Base64UrlDecode(model.Token);
            tokenToUse = Encoding.UTF8.GetString(tokenBytes);
        }
        catch
        {
            // якщо фронт надсилає сирий токен без кодування — використаємо як є
            tokenToUse = model.Token;
        }

        var result = await _userManager.ResetPasswordAsync(user, tokenToUse, model.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { message = "Пароль змінено" });
    }
    [Authorize]
    [HttpPut("update-self")]
    public async Task<IActionResult> UpdateSelf([FromBody] UpdateUserModel model)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound();

        user.FirstName = model.FirstName ?? user.FirstName;
        user.LastName = model.LastName ?? user.LastName;
        user.Region = model.Region ?? user.Region;
        user.CityOrVillage = model.CityOrVillage ?? user.CityOrVillage;
        user.PhoneNumber = model.PhoneNumber ?? user.PhoneNumber;

        var res = await _userManager.UpdateAsync(user);
        if (!res.Succeeded)
            return BadRequest(res.Errors);

        return Ok(new { Message = "Profile updated successfully." });
    }
    [Authorize]
    [HttpPost("update-photo")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdatePhoto([FromForm] UpdatePhotoForm form)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound("User not found.");

        var image = form.Image;
        if (image == null || image.Length == 0)
            return BadRequest("Файл зображення не надіслано.");

        var allowed = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
        var contentType = image.ContentType?.ToLowerInvariant();
        if (string.IsNullOrEmpty(contentType) || !allowed.Contains(contentType))
            return BadRequest("Підтримуються лише JPG/PNG/WEBP.");

        const long maxBytes = 5 * 1024 * 1024;
        if (image.Length > maxBytes)
            return BadRequest("Занадто великий файл (макс. 5 МБ).");

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var dir = Path.Combine(webRoot, "avatars");
        Directory.CreateDirectory(dir);

        var ext = contentType switch
        {
            "image/jpeg" or "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".jpg"
        };

        var fileName = $"{user.Id}_{Guid.NewGuid():N}{ext}";
        var absPath = Path.Combine(dir, fileName);

        await using (var fs = System.IO.File.Create(absPath))
            await image.CopyToAsync(fs);

        // (опційно) видаляємо попереднє локальне фото
        if (!string.IsNullOrWhiteSpace(user.ProfilePhoto) && user.ProfilePhoto.StartsWith("/avatars/"))
        {
            try
            {
                var oldAbs = Path.Combine(webRoot, user.ProfilePhoto.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(oldAbs)) System.IO.File.Delete(oldAbs);
            }
            catch { /* ігноруємо */ }
        }

        user.ProfilePhoto = $"/avatars/{fileName}";
        var res = await _userManager.UpdateAsync(user);
        if (!res.Succeeded) return BadRequest(res.Errors);

        return Ok(new { profilePhoto = user.ProfilePhoto });
    }



}
