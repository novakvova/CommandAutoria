// Models/Dtos/CarDetailsDto.cs
public record CarPhotoDto(int Id, string Url);

public record CarDetailsDto(
    int Id,
    string? Brand,
    string? Model,
    int Year,
    decimal Price,
    string? Condition,
    int Mileage,
    double EngineVolume,
    string? EngineType,
    string? Color,
    string? FuelConsumptionCity,
    string? FuelConsumptionHighway,
    string? Transmission,
    string? DriveType,
    string? Description,
    string? Number,
    string? VIN,
    IEnumerable<CarPhotoDto> Photos,
    long? OwnerId   // 👈 ключове поле
);
