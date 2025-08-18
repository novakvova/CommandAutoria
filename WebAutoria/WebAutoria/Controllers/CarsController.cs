using Microsoft.AspNetCore.Mvc;
using WebAutoria.Data;
using WebAutoria.Entities;

namespace WebAutoria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly AppDbAutoriaContext _context;
        public CarsController(AppDbAutoriaContext context) => _context = context;

        // CRUD endpoints for CarEntity тут
    }
}