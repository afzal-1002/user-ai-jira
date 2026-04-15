import { NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-directives',
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault],
  templateUrl: './directives.component.html',
  styleUrl: './directives.component.css'
})
export class DirectivesComponent {
  show = false;
  count = 1;
  students = [{ id: 1, name: "Muhammad Afzal", age: 24, grade: "A", major: "Computer Science" },
              { id: 2, name: "Ali Raza", age: 23, grade: "B+", major: "Electrical Engineering" },
              { id: 3, name: "Sara Khan", age: 22, grade: "A-", major: "Mechanical Engineering" },
              { id: 4, name: "Ahmed Iqbal", age: 25, grade: "B", major: "Software Engineering" }];

    color = "";

    changeColor(val: string){
      this.color = val;
    }
}
