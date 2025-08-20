using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using WebAutoria.Data.Entities.Identity;
using WebAutoria.Models.Account;

namespace WebAutoria.Controllers
{
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

            // Фото профілю
            string? profilePhotoPath = null;
            if (model.ImageFile != null && model.ImageFile.Length > 0)
            {
                var uploadsFolder = Path.Combine("wwwroot", "uploads", "profiles");
                Directory.CreateDirectory(uploadsFolder); // Створити, якщо немає

                var fileName = Guid.NewGuid() + Path.GetExtension(model.ImageFile.FileName);
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await model.ImageFile.CopyToAsync(stream);
                }

                profilePhotoPath = Path.Combine("uploads", "profiles", fileName).Replace("\\", "/");
            }

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
                ProfilePhoto = profilePhotoPath
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
}