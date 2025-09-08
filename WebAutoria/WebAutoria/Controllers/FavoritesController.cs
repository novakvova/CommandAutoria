// Updated FavoritesController.cs with endpoints for favorites
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebAutoria.Data;
using WebAutoria.Data.Entities.Identity;

namespace WebAutoria.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly AppDbAutoriaContext _context;

    public FavoritesController(AppDbAutoriaContext context) => _context = context;

    // GET: api/favorites - Get list of favorite cars for current user
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CarEntity>>> GetFavorites()
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (userId == 0) return Unauthorized();

        var cars = await _context.Cars
            .AsNoTracking()
            .Include(c => c.Photos)                     // ⬅️ фото підтягуються
            .Where(c => _context.Favorites
                .Any(f => f.UserId == userId && f.CarId == c.Id))
            .ToListAsync();

        return Ok(cars);
    }


    // POST: api/favorites/{carId} - Add car to favorites
    [HttpPost("{carId:int}")]
    public async Task<IActionResult> AddFavorite(int carId)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (userId == 0) return Unauthorized();

        var carExists = await _context.Cars.AnyAsync(c => c.Id == carId);
        if (!carExists) return NotFound("Car not found");

        var existingFavorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.CarId == carId);

        if (existingFavorite != null) return BadRequest("Already in favorites");

        var favorite = new FavoriteEntity { UserId = userId, CarId = carId };
        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync();

        return Ok();
    }

    // DELETE: api/favorites/{carId} - Remove car from favorites
    [HttpDelete("{carId:int}")]
    public async Task<IActionResult> RemoveFavorite(int carId)
    {
        var userId = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (userId == 0) return Unauthorized();

        var favorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.CarId == carId);

        if (favorite == null) return NotFound("Not in favorites");

        _context.Favorites.Remove(favorite);
        await _context.SaveChangesAsync();

        return Ok();
    }
}