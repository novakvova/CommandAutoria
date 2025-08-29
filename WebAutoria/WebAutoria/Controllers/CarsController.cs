using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
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

            // Id має бути 0 для створення (EF згенерує значення)
            model.Id = 0;

            await _db.Cars.AddAsync(model, ct);
            await _db.SaveChangesAsync(ct);

            return CreatedAtAction(nameof(GetById), new { id = model.Id }, model);
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

            var entity = await _db.Cars.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entity == null)
                return NotFound();

            // Мапінг усіх полів CarEntity (без DTO — прямо)
            entity.Brand = model.Brand;
            entity.Model = model.Model;
            entity.Year = model.Year;
            entity.Price = model.Price;
            entity.Condition = model.Condition;
            entity.Mileage = model.Mileage;
            entity.Photo = model.Photo;
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
