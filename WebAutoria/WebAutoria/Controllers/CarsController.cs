using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using WebAutoria.Data;
using WebAutoria.Data.Entities.Identity;
using WebAutoria.Models;

namespace WebAutoria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly AppDbAutoriaContext _db;
        private readonly UserManager<UserEntity> _userManager;

        public CarsController(AppDbAutoriaContext db, UserManager<UserEntity> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        private bool IsAdmin() => User.IsInRole("Admin");

        private async Task<long> CurrentUserIdAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            var idStr = await _userManager.GetUserIdAsync(user);
            return long.TryParse(idStr, out var id) ? id : 0;
        }

        /// <summary>Список усіх авто</summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<CarEntity>), 200)]
        public async Task<ActionResult<IEnumerable<CarEntity>>> GetAll(CancellationToken ct)
        {
            var items = await _db.Cars
                .AsNoTracking()
                .Include(x => x.Photos)
                .ToListAsync(ct);

            return Ok(items);
        }

        /// <summary>Отримати авто за Id (з ownerId через Ads)</summary>
        [HttpGet("{id:int}")]
        public async Task<ActionResult<CarDetailsDto>> GetById(int id, CancellationToken ct)
        {
            var car = await _db.Cars
                .AsNoTracking()
                .Include(c => c.Photos)
                .FirstOrDefaultAsync(c => c.Id == id, ct);

            if (car is null) return NotFound();

            // Власник = userId з останнього Ad для цього CarId
            var ownerId = await _db.Ads
                .Where(a => a.CarId == id)
                .OrderByDescending(a => a.Id)                 // надійніше за CreatedAt
                .Select(a => (long?)a.UserId)
                .FirstOrDefaultAsync(ct);

            var dto = new CarDetailsDto(
                car.Id,
                car.Brand,
                car.Model,
                car.Year,
                car.Price,
                car.Condition,
                car.Mileage,
                car.EngineVolume,
                car.EngineType,
                car.Color,
                car.FuelConsumptionCity,
                car.FuelConsumptionHighway,
                car.Transmission,
                car.DriveType,
                car.Description,
                car.Number,
                car.VIN,
                car.Photos.Select(p => new CarPhotoDto(p.Id, p.Url)),
                ownerId
            );

            return Ok(dto);
        }

        /// <summary>Створити авто + автоматично створити Ad для поточного користувача</summary>
        [Authorize]
        [HttpPost]
        [ProducesResponseType(typeof(CarEntity), 201)]
        [ProducesResponseType(400)]
        public async Task<ActionResult<CarEntity>> Create([FromBody] CarEntity model, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            model.Id = 0;

            // Лишаємо тільки валідні фото
            model.Photos = (model.Photos ?? new List<CarPhotoEntity>())
                .Where(p => !string.IsNullOrWhiteSpace(p.Url))
                .Select(p => new CarPhotoEntity { Url = p.Url.Trim() })
                .ToList();

            // Транзакція: спочатку авто, потім Ad
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            await _db.Cars.AddAsync(model, ct);
            await _db.SaveChangesAsync(ct); // отримуємо model.Id

            var me = await CurrentUserIdAsync();
            var ad = new AdEntity
            {
                CarId = model.Id,
                UserId = me,
                CreatedAt = System.DateTime.UtcNow // якщо у вашій моделі це поле є
            };
            await _db.Ads.AddAsync(ad, ct);
            await _db.SaveChangesAsync(ct);

            await tx.CommitAsync(ct);

            var withPhotos = await _db.Cars
                .Include(x => x.Photos)
                .FirstAsync(x => x.Id == model.Id, ct);

            return CreatedAtAction(nameof(GetById), new { id = model.Id }, withPhotos);
        }

        /// <summary>Оновити авто (доступ: власник Ad або адмін)</summary>
        [Authorize]
        [HttpPut("{id:int}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> Update(int id, [FromBody] CarEntity model, CancellationToken ct)
        {
            if (id != model.Id)
                return BadRequest("Id у шляху та в тілі запиту повинні збігатися.");
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var entity = await _db.Cars
                .Include(x => x.Photos)
                .FirstOrDefaultAsync(x => x.Id == id, ct);

            if (entity == null)
                return NotFound();

            // Перевірка прав
            if (!IsAdmin())
            {
                var ownerId = await _db.Ads
                    .Where(a => a.CarId == id)
                    .OrderByDescending(a => a.Id)
                    .Select(a => (long?)a.UserId)
                    .FirstOrDefaultAsync(ct);

                var me = await CurrentUserIdAsync();
                if (ownerId is null || ownerId.Value != me)
                    return Forbid();
            }

            // Оновлення скалярів
            entity.Brand = model.Brand;
            entity.Model = model.Model;
            entity.Year = model.Year;
            entity.Price = model.Price;
            entity.Condition = model.Condition;
            entity.Mileage = model.Mileage;
            entity.EngineVolume = model.EngineVolume;
            entity.EngineType = model.EngineType;
            entity.Color = model.Color;
            entity.FuelConsumptionCity = model.FuelConsumptionCity;
            entity.FuelConsumptionHighway = model.FuelConsumptionHighway;
            entity.Transmission = model.Transmission;
            entity.DriveType = model.DriveType;
            entity.Description = model.Description;
            entity.Number = model.Number;
            entity.VIN = model.VIN;

            // Фото: синхронізація
            var incoming = (model.Photos ?? new List<CarPhotoEntity>())
                .Where(p => !string.IsNullOrWhiteSpace(p.Url))
                .Select(p => { p.Url = p.Url.Trim(); return p; })
                .ToList();

            var incomingIds = incoming.Where(p => p.Id != 0).Select(p => p.Id).ToHashSet();
            var toRemove = entity.Photos.Where(p => !incomingIds.Contains(p.Id)).ToList();
            if (toRemove.Count > 0)
                _db.RemoveRange(toRemove);

            foreach (var p in incoming)
            {
                if (p.Id == 0)
                    entity.Photos.Add(new CarPhotoEntity { Url = p.Url, CarId = entity.Id });
                else
                {
                    var existing = entity.Photos.FirstOrDefault(x => x.Id == p.Id);
                    if (existing != null) existing.Url = p.Url;
                }
            }

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        /// <summary>Видалити авто + усі Ads цього авто (доступ: власник Ad або адмін)</summary>
        [Authorize]
        [HttpDelete("{id:int}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.Cars.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity == null) return NotFound();

            // Перевірка прав
            if (!IsAdmin())
            {
                var ownerId = await _db.Ads
                    .Where(a => a.CarId == id)
                    .OrderByDescending(a => a.Id)
                    .Select(a => (long?)a.UserId)
                    .FirstOrDefaultAsync(ct);

                var me = await CurrentUserIdAsync();
                if (ownerId is null || ownerId.Value != me)
                    return Forbid();
            }

            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            // Видаляємо всі Ads цього авто
            var ads = await _db.Ads.Where(a => a.CarId == id).ToListAsync(ct);
            if (ads.Count > 0) _db.Ads.RemoveRange(ads);

            // Видаляємо авто
            _db.Cars.Remove(entity);

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return NoContent();
        }

        // (опційно) Список "мої авто" — щоб фронт показував лише власника
        [Authorize]
        [HttpGet("mine")]
        public async Task<ActionResult<IEnumerable<CarEntity>>> GetMine(CancellationToken ct)
        {
            var me = await CurrentUserIdAsync();

            // авто, для яких є хоча б один Ad з моїм UserId
            var myCarIds = await _db.Ads
                .Where(a => a.UserId == me)
                .Select(a => a.CarId)
                .Distinct()
                .ToListAsync(ct);

            var items = await _db.Cars
                .AsNoTracking()
                .Include(c => c.Photos)
                .Where(c => myCarIds.Contains(c.Id))
                .ToListAsync(ct);

            return Ok(items);
        }
    }
}
