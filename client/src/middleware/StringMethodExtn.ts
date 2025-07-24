declare global {
  interface String {
    transformCase(type: 'upper' | 'lower' | 'capitalize' | 'title' | 'snake' | 'kebab' | 'camel'): string;
  }
}

String.prototype.transformCase = function (type:string) : string {
  switch (type) {
    case "upper":
      return this.toUpperCase();
    case "lower":
      return this.toLowerCase();
    case "capitalize":
      return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
    case "title":
      return this.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    case "snake":
      return this.toLowerCase().replace(/\s+/g, '_');
    case "kebab":
      return this.toLowerCase().replace(/\s+/g, '-');
    case "camel":
      return this.split(' ')
        .map((word, i) => i === 0 
          ? word.toLowerCase() 
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
    default:
      return this.toString();
  }
}