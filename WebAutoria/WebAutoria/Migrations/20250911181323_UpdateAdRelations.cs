using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAutoria.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAdRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ads_Cars_CarId",
                table: "Ads");

            migrationBuilder.AddForeignKey(
                name: "FK_Ads_Cars_CarId",
                table: "Ads",
                column: "CarId",
                principalTable: "Cars",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ads_Cars_CarId",
                table: "Ads");

            migrationBuilder.AddForeignKey(
                name: "FK_Ads_Cars_CarId",
                table: "Ads",
                column: "CarId",
                principalTable: "Cars",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
