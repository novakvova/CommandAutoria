using System.ComponentModel.DataAnnotations;

namespace WebAutoria.Entities.Identity
{
    public class FavoriteEntity
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int UserId { get; set; }
        public UserEntity User { get; set; }

        [Required]
        public int CarId { get; set; }
        public CarEntity Car { get; set; }
    }
}