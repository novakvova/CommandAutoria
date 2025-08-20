using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Security.Claims;
using WebAutoria.Data.Entities.Identity;
using WebAutoria.Models.Account;
using WebAutoria.Services;

namespace WebAutoria.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountController(
    UserManager<UserEntity> userManager,
    SignInManager<UserEntity> signInManager,
    TokenService tokenService,
    IWebHostEnvironment env) : ControllerBase
{
    private readonly IWebHostEnvironment _env = env;
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
}
