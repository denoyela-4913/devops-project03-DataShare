import { FileSizePipe } from './file-size-pipe';

describe('FileSizePipe', () => {
  const pipe = new FileSizePipe();

  it('formate les octets, Ko, Mo, Go', () => {
    expect(pipe.transform(0)).toBe('0 o');
    expect(pipe.transform(512)).toBe('512 o');
    expect(pipe.transform(1536)).toBe('1,5 Ko');
    expect(pipe.transform(5 * 1024 * 1024)).toBe('5,0 Mo');
    expect(pipe.transform(3 * 1024 ** 3)).toBe('3,0 Go');
  });

  it('respecte le nombre de décimales demandé', () => {
    expect(pipe.transform(1536, 2)).toBe('1,50 Ko');
  });

  it('renvoie un tiret pour une valeur absente ou invalide', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform(-1)).toBe('—');
    expect(pipe.transform(Number.NaN)).toBe('—');
  });
});
