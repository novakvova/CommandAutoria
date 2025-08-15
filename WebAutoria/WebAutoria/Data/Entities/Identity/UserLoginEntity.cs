﻿using Microsoft.AspNetCore.Identity;

namespace WebAutoria.Data.Entities.Identity;
public class UserLoginEntity : IdentityUserLogin<long>
{
    public UserEntity User { get; set; }
}
