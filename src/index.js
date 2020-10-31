import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

//Object for creating and nesting operations for recursive execution with proper precedence
function Operation(a, b = 0, op = "+"){
    this.a = a;
    this.b = b;
    this.op = op;

    this.eval = () => {
        //checks for nested Operation objects and executes
        let a = this.a;
        if(typeof a === "object"){
            a = a.eval();
        }
        let b = this.b;
        if(typeof b === "object"){
            b = b.eval();
        }

        switch(this.op){
            case "+": return a + b;
            case "-": return a - b;
            case "×": return a * b;
            case "÷": return a / b;
            default: console.log("invalid op");
        }
    }
}

function Key(props){
    return(
        <div id={props.id} className="button" onClick={props.callback} onKeyPress={props.callback} tabIndex={props.tabIndex}>{props.label}</div>
    )
}

function Display(props){
    return(
        <div id="display">
            <p>{props.value === '' ? 0 : props.value}</p>
        </div>
    );
}

function Keypad(props){
    let index = 1;
    return(
        <div id="keypad">
            <Key id="clear"     label="AC"  callback={props.callback} tabIndex={index++}/>
            <Key id="add"       label="+"   callback={props.callback} tabIndex={index++}/>

            <Key id="one"       label="1"   callback={props.callback} tabIndex={index++}/>
            <Key id="two"       label="2"   callback={props.callback} tabIndex={index++}/>
            <Key id="three"     label="3"   callback={props.callback} tabIndex={index++}/>
            <Key id="subtract"  label="-"   callback={props.callback} tabIndex={index++}/>

            <Key id="four"      label="4"   callback={props.callback} tabIndex={index++}/>
            <Key id="five"      label="5"   callback={props.callback} tabIndex={index++}/>
            <Key id="six"       label="6"   callback={props.callback} tabIndex={index++}/>
            <Key id="multiply"  label="×"   callback={props.callback} tabIndex={index++}/>

            <Key id="seven"     label="7"   callback={props.callback} tabIndex={index++}/>
            <Key id="eight"     label="8"   callback={props.callback} tabIndex={index++}/>
            <Key id="nine"      label="9"   callback={props.callback} tabIndex={index++}/>
            <Key id="divide"    label="÷"   callback={props.callback} tabIndex={index++}/>

            <Key id="zero"      label="0"   callback={props.callback} tabIndex={index++}/>
            <Key id="decimal"   label="."   callback={props.callback} tabIndex={index++}/>
            <Key id="equals"    label="="   callback={props.callback} tabIndex={index++}/>
        </div>
    );
}


class Calculator extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            formula: "",
            mode: "start operation"
        }
        this.handleClick = this.handleClick.bind(this);
        this.evaluate = this.evaluate.bind(this);
        this.insert = this.insert.bind(this);
    }

    handleClick(e){
        if( e.key === "Enter" || e.type === "click"){
            switch(e.target.id){
                case "clear": this.setState({formula: "", mode: "start operation"}); break;
                case "equals":
                    if(/[+\-×÷]/.test(this.state.formula.slice(-1))) return;
                    this.evaluate(this.state.formula);
                    break;
                default: this.insert(e.target.innerHTML);
            }
        }
    }

    //found out about eval() a day too late and I don't feel like reimplementing this
    evaluate(formula){
        if(formula.length === 0){
            return;
        }

        //tokenizes formula
        let regex = /(\d+\.?(\d+)?|[+\-×÷])/; //matches either an operator or a number
        let tokens = [];
        while(formula.length > 0){
            let object = regex.exec(formula);
            let token = null;
            if(/[+\-×÷]/.test(object[0])){
                token = {type: "op", value: object[0]};
            }
            else{
                token = {type: "num", value: parseFloat(object[0])};
            }

            tokens.push(token);
            formula = formula.substring(object[0].length);
        }

        //converts tokens of type num into an object of type Operation and leaves op tokens as is
        let operations = [];
        let prev = {type: "op"}; //set to op type for negative number at start of a formula
        let negate = false;
        for(let i = 0; i < tokens.length; ++i){
            if(tokens[i].type === "num"){
                if(negate){
                    operations.push(new Operation(-tokens[i].value));
                    negate = false;
                }
                else{
                    operations.push(new Operation(tokens[i].value));
                }
            }
            else if(tokens[i].value === "-" && prev.type === "op"){
                negate = true;
            }
            else{
                operations.push(tokens[i]);
            }
            prev = tokens[i];
        }

        //finds an operator and creates a Operation object with the surrounding Operation objects nesting until
        //only one Operation object remains in the array
        //this is done with multiplication and division first in order to follow proper precedence
        let i = 0;
        let precedence = 0;
        while(operations.length > 1){
            if(operations[i].type === "op" && precedence === 0){
                if(!( operations[i].value === "+" || operations[i].value === "-" )){
                    let newOP = new Operation(operations[i - 1], operations[i + 1], operations[i].value);
                    operations.splice(i - 1, 3, newOP);
                    i = 0;
                }
            }
            else if(operations[i].type === "op"){
                let newOP = new Operation(operations[i - 1], operations[i + 1], operations[i].value);
                operations.splice(i - 1, 3, newOP);
                i = 0;
            }

            ++i;
            if(i >= operations.length - 1){
                i = 0;
                precedence = 1;
            }
        }

        // console.log(operations[0].eval());
        let solution = Math.floor(operations[0].eval() * 10000) / 10000;
        this.setState({formula: solution, mode: "solved"});
    }

    insert(char){
        if(this.state.formula.length >= 13){
            return;
        }

        switch(char){
            case "0":
                switch(this.state.mode){
                    case "solved":
                        this.setState({formula: char, mode: "start zero"});
                        break;
                    case "start operation":
                        this.setState({formula: this.state.formula + char, mode: "start zero"});
                        break;
                    case "start zero":
                        return;
                    default:
                        this.setState({formula: this.state.formula + char});
                }
                break;
            case ".":
                switch(this.state.mode){
                    case "insert float":
                    case "start operation":
                        return;
                    case "insert digit":
                    case "start zero":
                        this.setState({formula: this.state.formula + char, mode: "insert float"});
                }
                break;
            case "+":
            case "×":
            case "÷":
                if(this.state.formula.length === 0) return;
                switch(this.state.mode){
                    case "solved":
                    case "insert digit":
                    case "insert float":
                        this.setState({formula: this.state.formula + char, mode: "start operation"});
                        break;
                    case "negate":
                        this.setState({formula: this.state.formula.slice(0, -2) + char, mode: "start operation"});
                        break;
                    case "start operation":
                        this.setState({formula: this.state.formula.slice(0, -1) + char});
                }
                break;
            case "-":
                switch(this.state.mode){
                    case "solved":
                    case "insert digit":
                    case "insert float":
                        this.setState({formula: this.state.formula + char, mode: "start operation"});
                        break;
                    case "start operation":
                        if(this.state.formula.slice(-1) === "-") return;
                        this.setState({formula: this.state.formula + char, mode: "negate"});
                        break;
                }
                break;
            default:
                switch(this.state.mode){
                    case "solved":
                        this.setState({formula: char, mode: "insert digit"});
                        break;
                    case "insert float":
                        this.setState({formula: this.state.formula + char});
                        break;
                    case "start zero":{
                        this.setState({formula: this.state.formula.slice(0, -1) + char, mode: "insert digit"});
                        break;
                    }
                    default:
                        this.setState({formula: this.state.formula + char, mode: "insert digit"});
                }
        }
    }

    render(){
        return(
            <div id="calculator">
                <Display value={this.state.formula}/>
                <Keypad callback={this.handleClick}/>
            </div>
        );
    }
}

function App(props){
    return(
        <div id="main-div">
            <Calculator/>
        </div>
    )
}

ReactDOM.render(<App/>, document.getElementById("root"));
