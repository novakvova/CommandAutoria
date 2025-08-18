using Microsoft.AspNetCore.Mvc;
using WebAutoria.Data;

namespace WebAutoria.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FavoritesController : ControllerBase
{
    private readonly AppDbAutoriaContext _context;
    public FavoritesController(AppDbAutoriaContext context) => _context = context;

    // CRUD endpoints for FavoriteEntity тут
}