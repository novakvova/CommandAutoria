using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.IO;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace WebAutoria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadsController : ControllerBase
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".jpg", ".jpeg", ".png", ".webp" };

        private const long MaxSizeBytes = 10 * 1024 * 1024; // 10MB на 1 файл

        [HttpPost]
        [RequestSizeLimit(MaxSizeBytes * 10)] // сумарний ліміт (за потреби)
        public async Task<IActionResult> Upload([FromForm] List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest("Файл(и) не надіслано.");

            var root = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "cars");
            Directory.CreateDirectory(root);

            var urls = new List<string>();

            foreach (var file in files)
            {
                if (file.Length == 0)
                    return BadRequest($"Порожній файл: {file.FileName}");

                if (file.Length > MaxSizeBytes)
                    return BadRequest($"Файл задовгий (>10MB): {file.FileName}");

                var ext = Path.GetExtension(file.FileName);
                if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
                    return BadRequest($"Неприпустиме розширення: {file.FileName}");

                var safeName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{ext.ToLower()}";
                var physical = Path.Combine(root, safeName);

                using (var fs = new FileStream(physical, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    await file.CopyToAsync(fs);
                }

                // ВІДНОСНИЙ URL для фронтенду
                urls.Add($"/uploads/cars/{safeName}");
            }

            return Ok(new { urls });
        }
    }
}
