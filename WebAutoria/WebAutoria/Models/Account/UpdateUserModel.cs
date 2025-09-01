using System.ComponentModel.DataAnnotations;

namespace WebAutoria.Models.Account
{
    public class UpdateUserModel
    {
        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(50)]
        public string? FirstName { get; set; }

        [StringLength(50)]
        public string? LastName { get; set; }

        [StringLength(100)]
        public string? Region { get; set; }

        [StringLength(100)]
        public string? CityOrVillage { get; set; }

        [Phone]
        public string? PhoneNumber { get; set; }

        public bool? IsConfirmed { get; set; }

        [StringLength(50)]
        public string? Role { get; set; }
    }
}