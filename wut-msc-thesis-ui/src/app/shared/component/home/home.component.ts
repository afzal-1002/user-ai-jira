import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

export class HomeComponent {

  // viewUser: User | undefined;



  // getUser(userId: number): User | undefined {
  //   const user = this.users.find((item) => item.id === userId);
  //   console.log(user);
  //   this.viewUser = user;
  //   return user;
  // }
}


