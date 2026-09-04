import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FileService } from '../../core/file/file.service';
import { Upload } from './upload';

function fileOfSize(bytes: number, name = 'doc.pdf'): File {
  const file = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
}

describe('Upload (integ)', () => {
  function render() {
    const fileService = {
      upload: vi.fn().mockReturnValue(
        of({
          downloadUrl: 'http://localhost:8080/d/abc123',
          token: 'abc123',
          name: 'doc.pdf',
          sizeBytes: 10,
          expiresAt: '2026-01-01T00:00:00Z',
        }),
      ),
    };
    TestBed.configureTestingModule({
      imports: [Upload],
      providers: [provideRouter([]), { provide: FileService, useValue: fileService }],
    });
    const fixture = TestBed.createComponent(Upload);
    fixture.detectChanges();
    return { fixture, fileService };
  }

  const testId = (fixture: ReturnType<typeof render>['fixture'], id: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${id}"]`);

  it("démarre sur l'état landing", () => {
    const { fixture } = render();
    expect(fixture.componentInstance.state()).toBe('landing');
    expect(testId(fixture, 'upload-landing')).not.toBeNull();
  });

  it('sélectionner un fichier passe au formulaire', () => {
    const { fixture } = render();
    fixture.componentInstance.selectedFile.set(fileOfSize(2 * 1_048_576));
    fixture.componentInstance.startUpload();
    fixture.detectChanges();
    expect(fixture.componentInstance.state()).toBe('form');
    expect(testId(fixture, 'upload-file-name')?.textContent).toContain('doc.pdf');
  });

  it('un fichier > 1 Go affiche une erreur et désactive le bouton', () => {
    const { fixture } = render();
    fixture.componentInstance.selectedFile.set(fileOfSize(2 * 1_073_741_824));
    fixture.componentInstance.startUpload();
    fixture.detectChanges();
    expect(fixture.componentInstance.fileTooLarge()).toBe(true);
    expect(testId(fixture, 'upload-size-error')).not.toBeNull();
    expect(testId(fixture, 'upload-submit')?.hasAttribute('disabled')).toBe(true);
  });

  it('formate la taille du fichier (Mo / Go)', () => {
    const { fixture } = render();
    fixture.componentInstance.selectedFile.set(fileOfSize(5 * 1_048_576));
    expect(fixture.componentInstance.fileSizeLabel()).toBe('5.0 Mo');
    fixture.componentInstance.selectedFile.set(fileOfSize(3 * 1_073_741_824));
    expect(fixture.componentInstance.fileSizeLabel()).toBe('3.0 Go');
  });

  it("submit appelle FileService.upload et passe à l'état succès avec le lien", () => {
    const { fixture, fileService } = render();
    fixture.componentInstance.selectedFile.set(fileOfSize(10 * 1_048_576));
    fixture.componentInstance.startUpload();
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fileService.upload).toHaveBeenCalledWith(expect.any(File), {
      expirationDays: 7,
      password: undefined,
    });
    expect(fixture.componentInstance.state()).toBe('success');
    expect(fixture.componentInstance.shareUrl()).toBe('http://localhost:8080/d/abc123');
    expect(testId(fixture, 'upload-share-url')).not.toBeNull();
  });

  it('une erreur serveur réactive le bouton', () => {
    const { fixture, fileService } = render();
    fileService.upload.mockReturnValue(throwError(() => new Error('400')));
    fixture.componentInstance.selectedFile.set(fileOfSize(10 * 1_048_576));
    fixture.componentInstance.startUpload();
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});
