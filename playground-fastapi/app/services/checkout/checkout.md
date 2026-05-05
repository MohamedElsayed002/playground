

Every single route in checkout has it own file. because If I wrote function in one single file. It will exceed 1000 line it's okay but for readability 


```py
def create_order(
    self,
    user_id,
    request: OrderCreate
):
    """
        Simple Route
    """

    # Check user with his carts 
    # then save the order in the database
    # return the order successfully :)
```

the steps that I'm follow 

<img src='./create_checkout/checkout-logic.png'>

I created this image with ChatGPT after I disccussed with him the desgin or the steps that big comapnies do in there route. and I focused on the Evil path "errors". and I tried as much as possible to do. 

But no I don't do that. recently I trying to focus more in each route. in multiple parts
tradeoffs, evil path طريق الشيطان :"D, transactions. what is acceptable to fail and what is not acceptable to fail 