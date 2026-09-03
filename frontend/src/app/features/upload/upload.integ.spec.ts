import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Upload } from './upload';

function fileOfSize(bytes: number, name = 'doc.pdf'): File {
  const file = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
}

describe('Upload (integ)', () => {
  function render() {
    TestBed.configureTestingModule({ imports: [Upload], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Upload);
    fixture.detectChanges();
    return fixture;
  }

  const testId = (fixture: ReturnType<typeof render>, id: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${id}"]`);

  it("démarre sur l'état landing", () => {
    const fixture = render();
    expect(fixture.componentInstance.state()).toBe('landing');
    expect(testId(fixture, 'upload-landing')).not.toBeNull();
  });

  it('sélectionner un fichier passe au formulaire', () => {
    const fixture = render();
    fixture.componentInstance.selectedFile.set(fileOfSize(2 * 1_048_576));
    fixture.componentInstance.startUpload();
    fixture.detectChanges();
    expect(fixture.componentInstance.state()).toBe('form');
    expect(testId(fixture, 'upload-form')).not.toBeNull();
    expect(testId(fixture, 'upload-file-name')?.textContent).toContain('doc.pdf');
  });

  it('un fichier > 1 Go affiche une erreur et désactive le bouton', () => {
    const fixture = render();
    fixture.componentInstance.selectedFile.set(fileOfSize(2 * 1_073_741_824));
    fixture.componentInstance.startUpload();
    fixture.detectChanges();
    expect(fixture.componentInstance.fileTooLarge()).toBe(true);
    expect(testId(fixture, 'upload-size-error')).not.toBeNull();
    expect(testId(fixture, 'upload-submit')?.hasAttribute('disabled')).toBe(true);
  });

  it('formate la taille du fichier (Mo / Go)', () => {
    const fixture = render();
    fixture.componentInstance.selectedFile.set(fileOfSize(5 * 1_048_576));
    expect(fixture.componentInstance.fileSizeLabel()).toBe('5.0 Mo');
    fixture.componentInstance.selectedFile.set(fileOfSize(3 * 1_073_741_824));
    expect(fixture.componentInstance.fileSizeLabel()).toBe('3.0 Go');
  });

  it("submit avec un fichier valide mène à l'état succès avec un lien", () => {
    vi.useFakeTimers();
    try {
      const fixture = render();
      fixture.componentInstance.selectedFile.set(fileOfSize(10 * 1_048_576));
      fixture.componentInstance.startUpload();
      fixture.componentInstance.submit();
      vi.runAllTimers();
      fixture.detectChanges();
      expect(fixture.componentInstance.state()).toBe('success');
      expect(fixture.componentInstance.shareUrl()).toBeTruthy();
      expect(testId(fixture, 'upload-share-url')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
