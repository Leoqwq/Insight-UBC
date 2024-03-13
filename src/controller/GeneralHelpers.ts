export class GeneralHelpers {
	public satisfy(field: string, val: string): boolean {
		if (val[0] === "*" && val[val.length - 1] === "*") {
			const part = val.substring(1, val.length - 1);
			return field.includes(part);
		} else if (val[0] === "*") {
			const part = val.substring(1, val.length);
			return field.endsWith(part);
		} else if (val[val.length - 1] === "*") {
			const part = val.substring(0, val.length - 1);
			return field.startsWith(part);
		}
		return field === val;
	}
}
