function isWhiteSpace(c) { return /\s/.test(c); }
function isDigit(c) { return /\d/.test(c); }
function isAlpha(c) { return /[a-zA-Z]/.test(c); }

class Tokenizer
{
    constructor(input)
    {
        this.input = input;
        this.index = 0;
    }

    atEnd()
    {
        return this.index >= this.input.length;
    }

    currentChar()
    {
        return this.input[this.index];
    }

    advanceChar()
    {
        this.index++;
    }

    nextToken()
    {
        this.error = false;

        do
        {
            if (this.atEnd()) return null;

            if (isWhiteSpace(this.currentChar())) this.advanceChar();
            else break;
        }
        while (true);

        let c = this.currentChar();

        switch (c)
        {
            case '+':
            case '-':
            case '*':
            case '/':
			case '^':
            case '(':
            case ')':          
                this.advanceChar();
                return c;
        }

        if (isDigit(c))
        {
            let number = c;
            let state = 1;
            let done = false;

            while (!done)
            {
                this.advanceChar();
                if (this.atEnd()) return number;
                c = this.currentChar();

                switch (state)
                {
                    case 1:
                        if (isDigit(c))
                        {
                            number += c;
                        }
                        else if (c == ".")
                        {
                            number += c;
                            state = 2;
                        }
                        else
                        {
                            done = true;
                        }
                        break;

                    case 2:
                        if (isDigit(c))
                        {
                            number += c;
                            state = 3;
                        }
                        else
                        {
                            this.error = true;
                            return null;
                        }
                        break;

                    case 3:
                        if (isDigit(c))
                        {
                            number += c;
                        }
                        else
                        {
                            done = true;
                        }
                        break;
                }
            }

            return number;
        }
        else if (isAlpha(c))
		{
            let word = c;
			while (true)
			{
                this.advanceChar();
                if (this.atEnd()) return word;
                c = this.currentChar();				
				if (!isAlpha(c)) return word;
				word += c;
			}
		}
		else
        {
            this.error = true;
            return null;
        }

    }

    peekToken()
    {
        let i = this.index;
        let peek = this.nextToken();
        this.index = i;
        return peek;
    }
}

class SyntaxAnalyzer
{
    constructor(input)
    {
        this.input = input;
        this.tokenizer = new Tokenizer(input);
        this.postfix = [];
    }

    analyze()
    {
        this.error = false;

        if (this.tokenizer.peekToken() == null)
        {
            this.error = true;
            return;
        }

        this.expr1();

        if (this.tokenizer.peekToken() != null || this.tokenizer.error)
            this.error = true;
    }

    expr1()
    {
        if (this.tokenizer.peekToken() == null) { this.error = true; return; }
        this.expr2(); if (this.error) return;
        let done = false;
        while (!done)
        {
            let peek = this.tokenizer.peekToken();
            if (peek == null) return;
            if (peek[0] == '+')
            {
                this.tokenizer.nextToken();
                this.expr2(); if (this.error) return;
                this.postfix.push("+");
            }
            else if (peek[0] == '-')
            {
                this.tokenizer.nextToken();
                this.expr2(); if (this.error) return;
                this.postfix.push("-");
            }
            else done = true;
        }
    }

    expr2()
    {
        if (this.tokenizer.peekToken() == null) { this.error = true; return; }
        this.expr2b(); if (this.error) return;
        let done = false;
        while (!done)
        {
            let peek = this.tokenizer.peekToken();
            if (peek == null) return;
            if (peek[0] == '*')
            {
                this.tokenizer.nextToken();
                this.expr2b(); if (this.error) return;
                this.postfix.push("*");
            }
            else if (peek[0] == '/')
            {
                this.tokenizer.nextToken();
                this.expr2b(); if (this.error) return;
                this.postfix.push("/");
            }
            else done = true;            
        }
    }

    expr2b()
    {
        if (this.tokenizer.peekToken() == null) { this.error = true; return; }
        this.expr3(); if (this.error) return;
        let done = false;
		let operations = 0;
        while (!done)
        {
            let peek = this.tokenizer.peekToken();
            if (peek == null)
			{
				while (operations > 0)
				{
					this.postfix.push("^");
					operations--;
				}
				return;
			}
            if (peek[0] == '^')
            {
                this.tokenizer.nextToken();
                this.expr3(); if (this.error) return;
				operations++;
            }
            else done = true;            
        }
		while (operations > 0)
		{
            this.postfix.push("^");
			operations--;
		}
    }

    expr3()
    {
        let peek = this.tokenizer.peekToken();
        if (peek == null) { this.error = true; return; }
        if (isDigit(peek[0]))
        {
            this.postfix.push(peek);
            this.tokenizer.nextToken();
        }
		else if (isAlpha(peek[0]))
		{
            let name = peek;
            let next = this.tokenizer.nextToken();
            let call = false;
            if (next != null)
            {
                let peek2 = this.tokenizer.peekToken();
                if (peek2 != null)
                {
                    if (peek2[0] == '(')
                    {
                        call = true;
                        this.tokenizer.nextToken();
                        this.expr1(); if (this.error) return;
                        let peek3 = this.tokenizer.peekToken();
                        if (peek3 == null || peek3[0] != ')')
                        {
                            this.error = true;
                            return;
                        }
                        else this.tokenizer.nextToken();
                    }
                }
            }
            if (call)
            {
                this.postfix.push(name);
            }
            else   
            {
                this.postfix.push("@" + name);
            }
		}
        else if (peek[0] == '-')
        {
            this.tokenizer.nextToken();
            this.expr3(); if (this.error) return;
            this.postfix.push("!");
        }
        else if (peek[0] == '+')
        {
            this.tokenizer.nextToken();
            this.expr3(); if (this.error) return;
        }
        else if (peek[0] == '(')
        {
            this.tokenizer.nextToken();
            this.expr1(); if (this.error) return;
            let peek2 = this.tokenizer.peekToken();
            if ((peek2 == null) || (peek2[0] != ')'))
            {
                this.error = true;
                return;
            }
            else this.tokenizer.nextToken();
        }
        else
        {
            this.error = true;
            return;
        }
    }
}

const constants = {
	"pi": Math.PI,
	"e": Math.E
};

const fnct = {
    "sqrt": Math.sqrt,
    "sin": Math.sin,
    "cos": Math.cos,
    "tan": Math.tan,
    "asin": Math.asin,
    "acos": Math.acos,
    "atan": Math.atan
};

class Calculator
{
    constructor(equation)
    {
        this.equation = equation;
        this.syntaxAnalyzer = new SyntaxAnalyzer(equation);
        this.syntaxAnalyzer.analyze();
        if (!this.syntaxAnalyzer.error)
        {
            this.calculate();
            if (this.error) this.result = "error";
        }
        else this.result = "error";
    }

    calculate()
    {
        this.error = false;

        let stack = [];
        this.syntaxAnalyzer.postfix.forEach(a => {
            let x, y;
            switch (a)
            {
                case '+':
                    if (stack.length < 2) { this.error = true; return; }
                    x = stack.pop();
                    y = stack.pop();
                    stack.push(y + x);
                    break;
                case '-':
                    if (stack.length < 2) { this.error = true; return; }
                    x = stack.pop();
                    y = stack.pop();
                    stack.push(y - x);
                    break;
                case '*':
                    if (stack.length < 2) { this.error = true; return; }
                    x = stack.pop();
                    y = stack.pop();
                    stack.push(y * x);
                    break;
                case '/':
                    if (stack.length < 2) { this.error = true; return; }
                    x = stack.pop();
                    y = stack.pop();
                    // if (x == 0) { this.error = true; return; }
                    stack.push(y / x);
                    break;
                case '^':
                    if (stack.length < 2) { this.error = true; return; }
                    x = stack.pop();
                    y = stack.pop();
                    stack.push(Math.pow(y, x));
                    break;
                case '!':
                    if (stack.length < 1) { this.error = true; return; }
                    stack.push(-stack.pop());
                    break;
            }
            if (isDigit(a[0]))
            {
                stack.push(parseFloat(a));
            }
			else if (a[0] == '@')
			{
                a = a.substring(1);
				if (constants[a]) { stack.push(constants[a]); }
				else { this.error = true; return; }
			}
			else if (isAlpha(a[0]))
			{
                if (a in fnct)
                {
                    if (stack.length < 1) { this.error = true; return; }
                    x = stack.pop();
                    stack.push(fnct[a](x));
                }
                else { this.error = true; return; }
			}
        });
        if (stack.length != 1) { this.error = true; return; }
        this.result = stack.pop();
    }
}

var calcNumber = 0;

function calc()
{
    calcNumber++;
    eqs = document.querySelector("#eq");
    let eq = eqs.value;
    eqs.value = "";
    let calc = new Calculator(eq);
    let table = document.querySelector("#results");
    let row = table.insertRow(0);
    let cell = row.insertCell(0);
    if (eq == "") eq = "?";

    let dev = "";
    if (document.querySelector("#dm").checked)
    {
        dev = "<div class=\"devinfo\">";
        dev += calc.syntaxAnalyzer.postfix.join(" ");
        dev += "</div>"
    }

    cell.innerHTML = calcNumber + ": " + eq + ' = ' + calc.result + dev;
}

function insert(value)
{
    let eq = document.querySelector("#eq").value;
    eq += value;
    document.querySelector("#eq").value = eq;
}
