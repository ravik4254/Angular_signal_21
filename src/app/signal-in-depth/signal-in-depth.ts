import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-signal-in-depth',
  imports: [],
  templateUrl: './signal-in-depth.html',
  styleUrl: './signal-in-depth.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalInDepth implements OnInit {
  count = signal<number>(0);

  title = signal<string>('Signal In Depth');

  isLoading = signal<boolean>(false);

  users = signal<string[]>([]);

  ngOnInit(): void {
    this.count.set(234);
    this.title.set('Welcome to Signal In Depth');
    this.isLoading.set(true);
    this.users.update(users => [...users, 'Alice', 'Bob', 'Charlie']);
    console.log(this.users());
  }

}
