namespace WebAutoria.Models.Account;

public class RegisterModel
{
    /// <summary>
    /// Електрона пошта користувача
    /// </summary>
    /// <example>Федір</example>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Електрона пошта користувача
    /// </summary>
    /// <example>Лупашко</example>
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Електрона пошта користувача
    /// </summary>
    /// <example>fedir@example.com</example>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Пароль користувача
    /// </summary>
    /// <example>Admin123!</example>
    public string Password { get; set; } = string.Empty;

    public IFormFile? ImageFile { get; set; } = null;
}
