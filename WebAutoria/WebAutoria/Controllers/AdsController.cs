using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAutoria.Data;
using WebAutoria.Data.Entities.Identity;

namespace WebAutoria.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdsController : ControllerBase
{
    private readonly AppDbAutoriaContext _db;
    private readonly UserManager<UserEntity> _userManager;

    public AdsController(AppDbAutoriaContext db, UserManager<UserEntity> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    private async Task<long> CurrentUserIdAsync()
    {
        var user = await _userManager.GetUserAsync(User);
        var idStr = await _userManager.GetUserIdAsync(user);
        return long.Parse(idStr);
    }

    private bool IsAdmin() => User.IsInRole("Admin");

    // ---------- READ (публічні) ----------
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var list = await _db.Ads
            .AsNoTracking()
            .Include(a => a.Car).ThenInclude(c => c.Photos)
            .Include(a => a.User)
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var ad = await _db.Ads
            .AsNoTracking()
            .Include(a => a.Car).ThenInclude(c => c.Photos)
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id, ct);
        return ad is null ? NotFound() : Ok(ad);
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        var me = await CurrentUserIdAsync();
        var list = await _db.Ads
            .AsNoTracking()
            .Include(a => a.Car).ThenInclude(c => c.Photos)
            .Where(a => a.UserId == me)
            .ToListAsync(ct);
        return Ok(list);
    }

    // ---------- CREATE ----------
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdEntity model, CancellationToken ct)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        // форсуємо власника з контексту користувача
        var me = await CurrentUserIdAsync();
        model.Id = 0;
        model.UserId = me;
        model.CreatedAt = DateTime.UtcNow;

        // перевіримо існування авто
        var carExists = await _db.Cars.AnyAsync(c => c.Id == model.CarId, ct);
        if (!carExists) return BadRequest("CarId is invalid.");

        await _db.Ads.AddAsync(model, ct);
        await _db.SaveChangesAsync(ct);

        var ad = await _db.Ads
            .Include(a => a.Car).ThenInclude(c => c.Photos)
            .Include(a => a.User)
            .FirstAsync(a => a.Id == model.Id, ct);

        return CreatedAtAction(nameof(GetById), new { id = ad.Id }, ad);
    }

    // ---------- UPDATE ----------
    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdEntity model, CancellationToken ct)
    {
        if (id != model.Id) return BadRequest("Path id must match body id.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var ad = await _db.Ads.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (ad == null) return NotFound();

        // доступ: адмін або власник
        if (!IsAdmin())
        {
            var me = await CurrentUserIdAsync();
            if (ad.UserId != me) return Forbid();
        }

        // Дозволені для апдейту поля (приклад): CarId
        if (ad.CarId != model.CarId)
        {
            var carExists = await _db.Cars.AnyAsync(c => c.Id == model.CarId, ct);
            if (!carExists) return BadRequest("CarId is invalid.");
            ad.CarId = model.CarId;
        }

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ---------- DELETE ----------
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var ad = await _db.Ads.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (ad == null) return NotFound();

        if (!IsAdmin())
        {
            var me = await CurrentUserIdAsync();
            if (ad.UserId != me) return Forbid();
        }

        _db.Ads.Remove(ad);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
