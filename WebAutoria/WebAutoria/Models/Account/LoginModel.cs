namespace WebAutoria.Models.Account;

public class LoginModel
{
    /// <example>fedir@example.com</example>
    public string Email { get; set; } = string.Empty;

    /// <example>Admin123!</example>
    public string Password { get; set; } = string.Empty;
}
