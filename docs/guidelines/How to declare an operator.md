# How to Declare an Operator

This document provides step-by-step instructions on how to declare a new operator in the `engine` workspace. The examples below are based on various operator implementations found in the `src/core/operators/` directory.

## Steps to Declare a New Operator

1. **Import Required Modules**
   - Import necessary modules and utilities. For example:

     ```typescript
     import { buildFunctionOperator } from '@core/operators/operators.js';
     ```

2. **Define the Operator**

   - Based on the user input, use the `buildFunctionOperator` function to define the operator. Provide the following details:
     - `name`: The name of the operator.
     - `description`: A brief description of what the operator does.
     - `labels`: Tags to categorize the operator (check `engine/src/core/operators/operators.ts`' `labels` definition for the list of available values).
     - `signature`: Define the input and output types :
     - `samples`: Provide example inputs and expected outputs.

     Example (Boolean Operator):

     ```typescript
     buildFunctionOperator(
       {
         name: 'xor',
         description: 'combines two booleans with exclusive or',
         labels: ['boolean'],
         signature: {
           input: [{ type: 'boolean' }, { type: 'boolean' }],
           output: [{ type: 'boolean' }]
         },
         samples: [
           {
             in: 'false false xor',
             out: 'false'
           },
           {
             in: 'true false xor',
             out: 'true'
           }
         ]
       },
       ({ operands }, { isSet: value1 }, { isSet: value2 }) =>
         operands.popush(2, (value1 && !value2) || (!value1 && value2) ? trueValue : falseValue)
     );
     ```

     Example (Integer Operator):

     ```typescript
     buildFunctionOperator(
       {
         name: 'add',
         description: 'adds two integers',
         labels: ['integer', 'math'],
         signature: {
           input: [{ type: 'integer' }, { type: 'integer' }],
           output: [{ type: 'integer' }]
         },
         samples: [
           {
             in: '1 2 add',
             out: '3'
           }
         ]
       },
       (state, { integer: value1 }, { integer: value2 }) => {
         const { operands } = state;
         const integerResult = toIntegerValue(value1 + value2);
         if (!integerResult.success) {
           return integerResult;
         }
         return operands.popush(2, integerResult.value);
       }
     );
     ```

3. **Implement the Logic**
   - Provide the implementation logic as the second argument to `buildFunctionOperator`. This is a function that:
     - Takes the engine's [`IInternalState`](engine/src/sdk/interfaces/IInternalState.ts) and expected input parameters.
     - Performs the desired operation.
     - Pushes the result back to the operands stack.

     Example (Boolean Logic):

     ```typescript
     ({ operands }, { isSet: value1 }, { isSet: value2 }) => operands.popush(2, value1 && value2 ? trueValue : falseValue)
     ```

     Example (Integer Logic):

     ```typescript
     (state, { integer: value1 }, { integer: value2 }) => {
       const { operands } = state;
       const integerResult = toIntegerValue(value1 * value2);
       if (!integerResult.success) {
         return integerResult;
       }
       return operands.popush(2, integerResult.value);
     }
     ```

4. **Save the File**
   - Save the operator in an appropriate directory, such as `src/core/operators/<category>/<operator-name>.ts`.

5. **Check implementation**
   - Use the following command to verify that the code complies with coding guidelines :

     ```bash
     npm run check -w engine
     ```

   - Use the following command to test the implementation:

     ```bash
     npm run test -w engine
     ```

By following these steps, you can successfully declare and implement a new operator in the `engine` workspace.
