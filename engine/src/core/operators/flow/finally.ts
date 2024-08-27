        /**
         * if exception
         * 
         * finally:
         *   store the exception while the subsequent code is executed
         *   replace with finally-finalized
         *   push subsequent code
         * 
         * finally-finalized:
         *   if no exception and one is stored, throw it
         */

            /**
             * if no exception
             * 
             * finally:
             *   replace with finally-finalized
             *   push subsequent code
             * 
             * finally-finalized:
             *   if exception => raise it 
             */

