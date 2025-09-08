using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WebAutoria.Data.Entities.Identity;

public class CarPhotoEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Url { get; set; } = null!;

    [ForeignKey(nameof(Car))]
    public int CarId { get; set; }

    [JsonIgnore]
    [ValidateNever]           // ← важливо: вимикаємо валідацію навігації
    public CarEntity? Car { get; set; }  // ← зробити nullable безпечніше
}
