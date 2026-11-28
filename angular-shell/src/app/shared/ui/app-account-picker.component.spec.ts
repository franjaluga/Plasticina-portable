import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlasticinaService } from '../../core/plasticina.service';
import { AppAccountPickerComponent } from './app-account-picker.component';

describe('AppAccountPickerComponent', () => {
  let fixture: ComponentFixture<AppAccountPickerComponent>;
  let component: AppAccountPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppAccountPickerComponent],
      providers: [PlasticinaService]
    }).compileComponents();
    fixture = TestBed.createComponent(AppAccountPickerComponent);
    component = fixture.componentInstance;
    component.name = 'custom_net_account[1][code]';
    component.accounts = [{ code: '4010101', name: 'Ventas' }];
    fixture.detectChanges();
  });

  it('codeOnly no crea panel de sugerencias y mantiene el input editable', () => {
    component.codeOnly = true;
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[data-account-search]') as HTMLInputElement;
    const hidden = fixture.nativeElement.querySelector('input[type=hidden]') as HTMLInputElement;

    input.value = 'Ventas';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.account-suggestions')).toBeNull();
    expect(input.readOnly).toBeFalse();
    expect(input.disabled).toBeFalse();
    expect(hidden.value).toBe('Ventas');
    expect(component.panelOpen).toBeFalse();
  });

  it('un puntero exterior cancela el timer pendiente y no resurrecta el panel', fakeAsync(() => {
    const input = fixture.nativeElement.querySelector('input[data-account-search]') as HTMLInputElement;
    input.value = '401';
    input.dispatchEvent(new Event('input'));
    tick(10);

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    tick(100);
    fixture.detectChanges();

    expect(component.panelOpen).toBeFalse();
    expect((component as unknown as { timer: unknown }).timer).toBeNull();
  }));
});
