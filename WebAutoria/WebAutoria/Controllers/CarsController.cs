using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using WebAutoria.Data.Entities.Identity;
using WebAutoria.Data;

namespace WebAutoria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly AppDbAutoriaContext _db;

        public CarsController(AppDbAutoriaContext db)
        {
            _db = db;
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

        /// <summary>Отримати авто за Id</summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(CarEntity), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<CarEntity>> GetById(int id, CancellationToken ct)
        {
            var item = await _db.Cars
                .AsNoTracking()
                .Include(x => x.Photos)
                .FirstOrDefaultAsync(x => x.Id == id, ct);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        /// <summary>Створити авто</summary>
        [HttpPost]
        [ProducesResponseType(typeof(CarEntity), 201)]
        [ProducesResponseType(400)]
        public async Task<ActionResult<CarEntity>> Create([FromBody] CarEntity model, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            model.Id = 0;

            // ✅ ОЧИСТКА ФОТО: беремо лише непорожні url
            model.Photos = (model.Photos ?? new List<CarPhotoEntity>())
                .Where(p => !string.IsNullOrWhiteSpace(p.Url))
                .Select(p => new CarPhotoEntity { Url = p.Url.Trim() })
                .ToList();

            await _db.Cars.AddAsync(model, ct);
            await _db.SaveChangesAsync(ct);

            var withPhotos = await _db.Cars
                .Include(x => x.Photos)
                .FirstAsync(x => x.Id == model.Id, ct);

            return CreatedAtAction(nameof(GetById), new { id = model.Id }, withPhotos);
        }

        /// <summary>Оновити авто (повне оновлення)</summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
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

            // 🔧 оновлення скалярних полів (як було)
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

            // ✅ ОЧИСТКА ВХІДНИХ ФОТО (лише з url)
            var incoming = (model.Photos ?? new List<CarPhotoEntity>())
                .Where(p => !string.IsNullOrWhiteSpace(p.Url))
                .Select(p => { p.Url = p.Url.Trim(); return p; })
                .ToList();

            // видалити ті, яких більше немає
            var incomingIds = incoming.Where(p => p.Id != 0).Select(p => p.Id).ToHashSet();
            var toRemove = entity.Photos.Where(p => !incomingIds.Contains(p.Id)).ToList();
            if (toRemove.Count > 0)
                _db.RemoveRange(toRemove);

            // оновити існуючі / додати нові
            foreach (var p in incoming)
            {
                if (p.Id == 0)
                {
                    entity.Photos.Add(new CarPhotoEntity { Url = p.Url, CarId = entity.Id });
                }
                else
                {
                    var existing = entity.Photos.FirstOrDefault(x => x.Id == p.Id);
                    if (existing != null)
                        existing.Url = p.Url;
                }
            }

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        /// <summary>Видалити авто</summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.Cars.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity == null)
                return NotFound();

            _db.Cars.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
