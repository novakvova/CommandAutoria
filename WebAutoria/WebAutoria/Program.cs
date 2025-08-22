//using Microsoft.AspNetCore.Authentication;
//using Microsoft.AspNetCore.Authentication.Google;
//using Microsoft.AspNetCore.Authentication.JwtBearer;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.Options;
//using Microsoft.IdentityModel.Tokens;
//using Microsoft.OpenApi.Models;
//using System.Text;
//using WebAutoria.Data;
//using WebAutoria.Data.Entities.Identity;
//using WebAutoria.Services;

//var builder = WebApplication.CreateBuilder(args);

//// Add services to the container.

//builder.Services.AddDbContext<AppDbAutoriaContext>(opt =>
//{
//    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
//});

//builder.Services.AddIdentity<UserEntity, RoleEntity>(options =>
//{
//    options.Password.RequireDigit = false;
//    options.Password.RequireLowercase = false;
//    options.Password.RequireUppercase = false;
//    options.Password.RequiredLength = 6;
//    options.Password.RequireNonAlphanumeric = false;
//})
//    .AddEntityFrameworkStores<AppDbAutoriaContext>()
//    .AddDefaultTokenProviders();
//// JWT auth
//builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//    .AddJwtBearer(options =>
//    {
//        options.TokenValidationParameters = new TokenValidationParameters
//        {
//            ValidateIssuer = true,
//            ValidateAudience = true,
//            ValidateLifetime = true,
//            ValidateIssuerSigningKey = true,
//            ValidIssuer = builder.Configuration["Jwt:Issuer"],
//            ValidAudience = builder.Configuration["Jwt:Audience"],
//            IssuerSigningKey = new SymmetricSecurityKey(
//    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
//        }
//        ;
//    })
//    .AddGoogle("Google", options =>
//    {
//        options.ClientId = builder.Configuration["Google:ClientId"]!;
//        options.ClientSecret = builder.Configuration["Google:ClientSecret"]!;
//        // �������: ��� ���� �� �������� � Redirect URI � Google Cloud Console
//        options.CallbackPath = "/api/account/external-login-callback";
//        options.Scope.Add("profile");
//        options.Scope.Add("email");
//    });
//builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//    .AddJwtBearer(options =>
//    {
//        options.TokenValidationParameters = new TokenValidationParameters
//        {
//            ValidateIssuer = true,
//            ValidateAudience = true,
//            ValidateLifetime = true,
//            ValidateIssuerSigningKey = true,
//            ValidIssuer = builder.Configuration["Jwt:Issuer"],
//            ValidAudience = builder.Configuration["Jwt:Audience"],
//            IssuerSigningKey = new SymmetricSecurityKey(
//                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
//        };
//    })
//    .AddGoogle("Google", options =>
//    {
//        // �������� �������� � appsettings.json
//        options.ClientId = builder.Configuration["Google:ClientId"]!;
//        options.ClientSecret = builder.Configuration["Google:ClientSecret"]!;
//        // �������: ��� ���� �� �������� � Redirect URI � Google Cloud Console
//        options.CallbackPath = "/api/account/external-login-callback";
//        options.Scope.Add("profile");
//        options.Scope.Add("email");
//    });
//builder.Services.AddAuthorization();
////
//builder.Services.AddScoped<TokenService>();

//builder.Services.AddControllers();

//// Swagger + JWT
//builder.Services.AddSwaggerGen(o =>
//{
//    var jwtSecurityScheme = new OpenApiSecurityScheme
//    {
//        Scheme = "bearer",
//        BearerFormat = "JWT",
//        Name = "Authorization",
//        In = ParameterLocation.Header,
//        Type = SecuritySchemeType.Http,
//        Description = "����� JWT � ������: Bearer {token}",
//        Reference = new OpenApiReference
//        {
//            Id = JwtBearerDefaults.AuthenticationScheme,
//            Type = ReferenceType.SecurityScheme
//        }
//    };
//    o.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
//    o.AddSecurityRequirement(new OpenApiSecurityRequirement
//    {
//        { jwtSecurityScheme, Array.Empty<string>() }
//    });
//});

//var app = builder.Build();

//app.UseSwagger();
//app.UseSwaggerUI();
//app.UseStaticFiles();


//// Configure the HTTP request pipeline.
//app.UseAuthentication();

//app.UseAuthorization();

//app.MapControllers();

//app.Run();
//using Microsoft.AspNetCore.Authentication;
//using Microsoft.AspNetCore.Authentication.Google;
//using Microsoft.AspNetCore.Authentication.JwtBearer;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.IdentityModel.Tokens;
//using Microsoft.OpenApi.Models;
//using System.Text;
//using WebAutoria.Data;
//using WebAutoria.Data.Entities.Identity;
//using WebAutoria.Services;

//var builder = WebApplication.CreateBuilder(args);

//// ------------------ DbContext ------------------
//builder.Services.AddDbContext<AppDbAutoriaContext>(options =>
//{
//    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
//});

//// ------------------ Identity -------------------
//builder.Services
//    .AddIdentity<UserEntity, RoleEntity>(options =>
//    {
//        // �� ������� ����� ����������� ������� ������/���������� ����
//        options.User.RequireUniqueEmail = true;
//    })
//    .AddEntityFrameworkStores<AppDbAutoriaContext>()
//    .AddDefaultTokenProviders();

//// ------------------ ������ --------------------
//builder.Services.AddScoped<TokenService>();

//builder.Services.AddControllers();
//builder.Services.AddEndpointsApiExplorer();

//// ------------------ Swagger (+ JWT) -----------
//builder.Services.AddSwaggerGen(o =>
//{
//    var jwtSecurityScheme = new OpenApiSecurityScheme
//    {
//        Scheme = "bearer",
//        BearerFormat = "JWT",
//        Name = "Authorization",
//        In = ParameterLocation.Header,
//        Type = SecuritySchemeType.Http,
//        Description = "����� JWT � ������: Bearer {token}",
//        Reference = new OpenApiReference
//        {
//            Type = ReferenceType.SecurityScheme,
//            Id = JwtBearerDefaults.AuthenticationScheme // "Bearer"
//        }
//    };

//    o.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
//    o.AddSecurityRequirement(new OpenApiSecurityRequirement
//    {
//        { jwtSecurityScheme, Array.Empty<string>() }
//    });
//});

//// ------------------ CORS (�������) ------------
//builder.Services.AddCors(options =>
//{
//    options.AddPolicy("Frontend", policy =>
//    {
//        policy
//            .WithOrigins(
//                "http://localhost:5173"  // <-- ������ ��� �������� �� ��� ��������
//                                         //,"https://your-frontend.example.com" // ����
//            )
//            .AllowAnyHeader()
//            .AllowAnyMethod()
//            .AllowCredentials();
//    });
//});

//// --------------- Authentication (JWT + Google) -- ������ ���� ---------------
//builder.Services
//    .AddAuthentication(options =>
//    {
//        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme; // "Bearer"
//        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//    })
//    .AddJwtBearer(options =>
//    {
//        options.TokenValidationParameters = new TokenValidationParameters
//        {
//            ValidateIssuer = true,
//            ValidateAudience = true,
//            ValidateLifetime = true,
//            ValidateIssuerSigningKey = true,
//            ValidIssuer = builder.Configuration["Jwt:Issuer"],
//            ValidAudience = builder.Configuration["Jwt:Audience"],
//            IssuerSigningKey = new SymmetricSecurityKey(
//                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
//        };
//    })
//    .AddGoogle("Google", options =>
//    {
//        options.ClientId = builder.Configuration["Google:ClientId"]!;
//        options.ClientSecret = builder.Configuration["Google:ClientSecret"]!;
//        // �������: ��� ���� �� 1-�-1 �������� � Authorized redirect URI � Google Console
//        options.CallbackPath = "/api/account/external-login-callback";
//        options.Scope.Add("profile");
//        options.Scope.Add("email");
//    });

//builder.Services.AddAuthorization();

//// ------------------ App pipeline ----------------
//var app = builder.Build();

//app.UseSwagger();
//app.UseSwaggerUI();

//app.UseStaticFiles();

//app.UseCors("Frontend");

//app.UseAuthentication();
//app.UseAuthorization();

//app.MapControllers();

//app.Run();
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies; // CookieAuthenticationOptions
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using WebAutoria.Data;
using WebAutoria.Data.Entities.Identity;
using WebAutoria.Services;

var builder = WebApplication.CreateBuilder(args);

// ------------------ DbContext ------------------
builder.Services.AddDbContext<AppDbAutoriaContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// ------------------ Identity -------------------
builder.Services
    .AddIdentity<UserEntity, RoleEntity>(options =>
    {
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbAutoriaContext>()
    .AddDefaultTokenProviders();

// ------------------ Services -------------------
builder.Services.AddScoped<TokenService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ------------------ Swagger (+ JWT) -----------
builder.Services.AddSwaggerGen(o =>
{
    var jwtSecurityScheme = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "����� JWT � ������: Bearer {token}",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = JwtBearerDefaults.AuthenticationScheme // "Bearer"
        }
    };

    o.AddSecurityDefinition(jwtSecurityScheme.Reference.Id, jwtSecurityScheme);
    o.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, Array.Empty<string>() }
    });
});
// ------------------ HttpClient ----------------
// ����������� ������� ��� ���������� ���������� ��������
builder.Services.AddHttpClient();

// ------------------ CORS (�������) ------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173") // ����� �� ��� �����
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// -------- Authentication (JWT + Google) --------
// �����: AddIdentity ��� ������ cookie-����� (� �.�. Identity.External).
// ��� �� �� ������ AddCookie �� ��� � ������ ���� �����.
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme; // "Bearer"
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    })
    .AddGoogle("Google", options =>
    {
        options.ClientId = builder.Configuration["Google:ClientId"]!;
        options.ClientSecret = builder.Configuration["Google:ClientSecret"]!;
        options.CallbackPath = "/signin-google";

        options.SignInScheme = IdentityConstants.ExternalScheme;
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Scope.Add("profile");
        options.Scope.Add("email");
        /////////////
        options.Events = new OAuthEvents
        {
            OnRedirectToAuthorizationEndpoint = context =>
            {
                Console.WriteLine("[Google RedirectUri] " + context.RedirectUri);
                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            }
        };
        /////////////
    });

// ������������ ��� ������� �������� cookie-����� (��� �������� ���������)
builder.Services.Configure<CookieAuthenticationOptions>(IdentityConstants.ExternalScheme, o =>
{
    o.Cookie.Name = "ExternalAuth";
    o.Cookie.SameSite = SameSiteMode.Lax;
    o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    o.ExpireTimeSpan = TimeSpan.FromMinutes(5);
});

builder.Services.AddAuthorization();

// ------------------ Pipeline -------------------
var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseStaticFiles();
app.UseCors("Frontend");

// ������� SameSite (����������� ��� ��������)
app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.Lax
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.UseStaticFiles();

app.Run();

