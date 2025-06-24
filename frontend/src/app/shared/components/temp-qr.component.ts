import { Component, ElementRef, ViewChild } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-temp-qr',
  template: '<qrcode #qrcode [qrdata]="qrdata" [width]="width" errorCorrectionLevel="M"></qrcode>',
  standalone: true,
  imports: [QRCodeComponent]
})
export class TempQrComponent {
  @ViewChild('qrcode') qrcode!: QRCodeComponent;
  qrdata: string = '';
  width: number = 200;

  async getQRCodeDataUrl(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const canvas = this.qrcode.qrcElement.nativeElement.querySelector('canvas');
        resolve(canvas.toDataURL('image/png'));
      }, 100);
    });
  }
} 