using Microsoft.AspNetCore.Mvc;
using WebAutoria.Data;

namespace WebAutoria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdsController : ControllerBase
    {
        private readonly AppDbAutoriaContext _context;
        public AdsController(AppDbAutoriaContext context) => _context = context;

        // CRUD endpoints for AdEntity тут
    }
}