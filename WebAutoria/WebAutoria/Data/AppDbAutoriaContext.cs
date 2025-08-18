using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WebAutoria.Data.Entities.Identity;
using WebAutoria.Entities.Identity; // Додати цей using для CarEntity, AdEntity, FavoriteEntity

namespace WebAutoria.Data
{
    public class AppDbAutoriaContext : IdentityDbContext<UserEntity, RoleEntity, long,
        IdentityUserClaim<long>, UserRoleEntity, UserLoginEntity,
        IdentityRoleClaim<long>, IdentityUserToken<long>>
    {
        public AppDbAutoriaContext(DbContextOptions<AppDbAutoriaContext> options)
            : base(options)
        {
        }

        public DbSet<CarEntity> Cars { get; set; }
        public DbSet<AdEntity> Ads { get; set; }
        public DbSet<FavoriteEntity> Favorites { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<UserRoleEntity>(ur =>
            {
                ur.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(r => r.RoleId)
                    .IsRequired();

                ur.HasOne(ur => ur.User)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(u => u.UserId)
                    .IsRequired();
            });

            builder.Entity<UserLoginEntity>(b =>
            {
                b.HasOne(l => l.User)
                    .WithMany(u => u.UserLogins)
                    .HasForeignKey(l => l.UserId)
                    .IsRequired();
            });

            builder.Entity<UserEntity>(b =>
            {
                b.HasMany(u => u.Favorites)
                    .WithOne(f => f.User)
                    .HasForeignKey(f => f.UserId)
                    .IsRequired();

                b.HasMany(u => u.Ads)
                    .WithOne(a => a.User)
                    .HasForeignKey(a => a.UserId)
                    .IsRequired();
            });
        }
    }
}