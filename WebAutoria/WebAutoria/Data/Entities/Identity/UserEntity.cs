using Microsoft.AspNetCore.Identity;
using System;

namespace WebAutoria.Data.Entities.Identity
{
    public class UserEntity : IdentityUser<long>
    {
        public string? LastName { get; set; }
        public string? FirstName { get; set; }
        public string? ProfilePhoto { get; set; }
        public string? Region { get; set; }
        public string? CityOrVillage { get; set; }
        public DateTime RegistrationDate { get; set; }
        public DateTime? LastOnline { get; set; }
        public bool IsConfirmed { get; set; }

    public ICollection<FavoriteEntity> Favorites { get; set; }
    public ICollection<AdEntity> Ads { get; set; } = new List<AdEntity>();

        public virtual ICollection<UserRoleEntity>? UserRoles { get; set; }
        public virtual ICollection<UserLoginEntity>? UserLogins { get; set; }
    }
}