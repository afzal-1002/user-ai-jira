import { Component , effect, signal} from '@angular/core';

@Component({
  selector: 'app-signal',
  imports: [],
  templateUrl: './signal.component.html',
  styleUrl: './signal.component.css'
})
export class SignalComponent {

  //Signals 
  count = signal(25);
  constructor() {
    effect(() => {
      console.log(this.count());
    })
  }

  updateValue(val: string) {
    if (val == 'inc') {
      this.count.set(this.count() + 1);
    } else if (val == 'dec') {
      this.count.set(this.count() - 1);
    }

  }

    // Dynamic Style:
  bgColor = "red"
  fontSizeWithoutpx = "50"
  fontSizeSmall = "30px"
  fontSizeLarge = "60px"

  zoomSize = true;


}
