// Додати поля: область, місто/село, фото профілю, номер телефону, дата реєстрації, роль, останній раз у мережі, аккаунт підтверджено
using Microsoft.AspNetCore.Identity;

namespace WebAutoria.Data.Entities.Identity;

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
    public ICollection<AdEntity> Ads { get; set; }

    public virtual ICollection<UserRoleEntity>? UserRoles { get; set; }
    public virtual ICollection<UserLoginEntity>? UserLogins { get; set; }
}