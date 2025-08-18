using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebAutoria.Data.Entities.Identity;


public class AdEntity
{
    [Key]
    public int Id { get; set; }
    [ForeignKey(nameof(User))]
    public int UserId { get; set; }
    public UserEntity User { get; set; }

    [ForeignKey(nameof(Car))]
    public int CarId { get; set; }
    public CarEntity Car { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}