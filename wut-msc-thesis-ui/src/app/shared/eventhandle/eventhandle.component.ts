import { Component } from '@angular/core';

@Component({
  selector: 'app-eventhandle',
  imports: [],
  templateUrl: './eventhandle.component.html',
  styleUrl: './eventhandle.component.css'
})
export class EventhandleComponent {

  name = "";
  fullName = ""

  handleClick() {
    // alert("Function called + my Name is " + this.name);

    this.fullName = this.name + " Afzal";
    console.log(" My Name is " + this.fullName);
    this.otherFunction()
  }

  otherFunction() {
    console.log("otherFunction");
  }

  ////count mthod
  count: number = 0;



  handleIncrement() {
    this.count = this.count + 1;
    // console.log(this.count);
  }

  handleDecrement() {
    this.count = this.count - 1;
    console.log(this.count);
  }
  handleReset() {
    this.count = 0;
  }

  handleCounter(val: string) {
    if (val == 'plus') {
      this.count = this.count + 1;
    } else if (val == 'minus') {
      if (this.count < 0) {
        this.count = 0;
      } else
        this.count = this.count - 1;
    } else {
      this.count = 0;
    }
  }

  handleEventMouse(event: MouseEvent) {
    console.log(" Event called ", event.type);
    console.log(" Event called ", event.target);
    console.log(" Event called ", (event.target as Element).classList);
  }

  handleEvent(event: Event) {
    console.log(" Event called ", event.type);
    console.log(" Event called ", (event.target as Element).classList);
    console.log("Input event values ", (event.target as HTMLInputElement).value);
  }

  handleInputEvent(event: Event) {
    console.log(" Event called ", event.type);
    console.log(" Event called ", (event.target as Element).classList);
    console.log("Input event values ", (event.target as HTMLInputElement).value);
  }


}
