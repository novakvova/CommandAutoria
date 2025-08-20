using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebAutoria.Data.Entities.Identity;

public class FavoriteEntity
{
    [Key]
    public int Id { get; set; }
    [ForeignKey(nameof(User))]
    public long UserId { get; set; }
    public UserEntity User { get; set; }

    [ForeignKey(nameof(Car))]
    public int CarId { get; set; }
    public CarEntity Car { get; set; }
}