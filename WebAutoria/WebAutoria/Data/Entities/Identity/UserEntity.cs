// Додати поля: область, місто/село, фото профілю, номер телефону, дата реєстрації, роль, останній раз у мережі, аккаунт підтверджено

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace WebAutoria.Entities.Identity
{
    public class UserEntity
    {
        [Key]
        public int Id { get; set; }

        public string? LastName { get; set; }
        public string? FirstName { get; set; }
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }
        public string? ProfilePhoto { get; set; }
        public string? Region { get; set; }
        public string? CityOrVillage { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime RegistrationDate { get; set; }
        public string? Role { get; set; }
        public DateTime? LastOnline { get; set; }
        public bool IsConfirmed { get; set; }

        public ICollection<FavoriteEntity> Favorites { get; set; }
        public ICollection<AdEntity> Ads { get; set; }
    }
}