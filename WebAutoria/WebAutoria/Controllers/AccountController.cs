using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using WebAutoria.Data.Entities.Identity;
using WebAutoria.Models.Account;

namespace WebAutoria.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AccountController(UserManager<UserEntity> userManager) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromForm] RegisterModel model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var user = new UserEntity
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName
        };
        var result = await userManager.CreateAsync(user, model.Password);
        if (result.Succeeded)
        {
            return Ok(new { Message = "User registered successfully." });
        }
        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }
        return BadRequest(ModelState);
    }

}
