using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace WebAutoria.Models.Account
{
    public class RegisterModel
    {
        /// <summary>
        /// Ім'я користувача
        /// </summary>
        [Required(ErrorMessage = "Ім'я обов'язкове")]
        [StringLength(50, ErrorMessage = "Ім'я не може бути більше 50 символів")]
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// Прізвище користувача
        /// </summary>
        [Required(ErrorMessage = "Прізвище обов'язкове")]
        [StringLength(50, ErrorMessage = "Прізвище не може бути більше 50 символів")]
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// Область
        /// </summary>
        [Required(ErrorMessage = "Область обов'язкова")]
        [StringLength(100, ErrorMessage = "Область не може бути більше 100 символів")]
        public string Region { get; set; } = string.Empty;

        /// <summary>
        /// Місто або село
        /// </summary>
        [Required(ErrorMessage = "Місто/село обов'язкове")]
        [StringLength(100, ErrorMessage = "Місто/село не може бути більше 100 символів")]
        public string CityOrVillage { get; set; } = string.Empty;

        /// <summary>
        /// Електронна пошта
        /// </summary>
        [Required(ErrorMessage = "Email обов'язковий")]
        [EmailAddress(ErrorMessage = "Невірний формат email")]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Номер телефону
        /// </summary>
        [Required(ErrorMessage = "Номер телефону обов'язковий")]
        [Phone(ErrorMessage = "Невірний формат телефону")]
        [StringLength(20, ErrorMessage = "Телефон не може бути більше 20 символів")]
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// Пароль
        /// </summary>
        [Required(ErrorMessage = "Пароль обов'язковий")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Пароль має бути мінімум 6 символів")]
        [DataType(DataType.Password)]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{6,}$",
            ErrorMessage = "Пароль має містити великі та малі літери, цифру, спецсимвол")]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Підтвердження пароля
        /// </summary>
        [Required(ErrorMessage = "Підтвердження пароля обов'язкове")]
        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "Паролі не співпадають")]
        public string ConfirmPassword { get; set; } = string.Empty;

        /// <summary>
        /// Фото профілю (завантажене з пристрою під час реєстрації)
        /// </summary>
        public IFormFile? ImageFile { get; set; } = null;

        /// <summary>
        /// Дата народження (опціонально, для додаткової перевірки)
        /// </summary>
        [DataType(DataType.Date)]
        [Display(Name = "Дата народження")]
        [CustomValidation(typeof(RegisterModel), nameof(ValidateBirthDate))]
        public DateTime? BirthDate { get; set; }

        // ------ ДОДАТКОВО: Можна додати властивість для збереження шляху фото, якщо потрібно показати його одразу після реєстрації ------
        /// <summary>
        /// Шлях до фото профілю після завантаження (заповнюється на сервері)
        /// </summary>
        public string? ProfilePhotoPath { get; set; }

        // Валідація дати народження
        public static ValidationResult? ValidateBirthDate(DateTime? birthDate, ValidationContext context)
        {
            if (birthDate == null) return ValidationResult.Success;
            if (birthDate > DateTime.Today)
                return new ValidationResult("Дата народження не може бути в майбутньому");
            if (birthDate < DateTime.Today.AddYears(-120))
                return new ValidationResult("Дата народження не може бути старше 120 років");
            return ValidationResult.Success;
        }
    }
}