import { JsonPipe, NgIf } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user/user.service';
import { User } from '../../../models/classes/user.model';

@Component({
  selector: 'app-user-profile',
 imports: [NgIf],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {

  userId!: number;
  userData!: User;
  user: User | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Editing profile for user ID:', this.userId);
    
    this.userService.getUserById(this.userId).subscribe(
      (user: User) => {
        this.userData = user;
        this.user = user;
      },
      (error) => {
        console.error('Error fetching user:', error);
      }
    );
  }
  updateProfile(): void {
    if (this.userId != null) {
      this.router.navigate(['update-profile', this.userId]);
    }
  }

  goHome(): void {
    if (this.userId != null && this.user?.userRole.includes('admin')) {
      this.router.navigate(['admin-dashboard', this.userId]);
    }else if (this.userId != null && this.user?.userRole.includes('user')) {
      this.router.navigate(['user-dashboard', this.userId]);
    } else {
      this.router.navigate(['/']);
    } 
    
  }

}
