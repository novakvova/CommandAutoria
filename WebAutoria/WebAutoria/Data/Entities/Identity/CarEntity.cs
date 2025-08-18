using System.ComponentModel.DataAnnotations;

namespace WebAutoria.Entities.Identity
{
    public class CarEntity
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string? Brand { get; set; }            // Марка
        [Required]
        public string? Model { get; set; }            // Модель
        [Required]
        public int Year { get; set; }                // Рік
        [Required]
        public decimal Price { get; set; }           // Ціна
        [Required]
        public string? Condition { get; set; }        // Стан (новий/бу)
        [Required]
        public int Mileage { get; set; }             // Пробіг
        public string? Photo { get; set; }            // Фото (шлях або URL)
        public double EngineVolume { get; set; }     // Обʼєм двигуна
        public string? EngineType { get; set; }       // Тип двигуна
        public string? Color { get; set; }            // Колір
        public string? FuelConsumptionCity { get; set; }    // Витрата (місто)
        public string? FuelConsumptionHighway { get; set; } // Витрата (траса)
        public string? Transmission { get; set; }     // Коробка передач
        public string? DriveType { get; set; }        // Привід
        public string? Description { get; set; }      // Опис
        public string? Number { get; set; }           // Номер
        public string? VIN { get; set; }              // VIN
    }
}