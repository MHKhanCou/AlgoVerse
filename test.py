from fastapi import FastAPI
from typing import Optional
from schemas import *

app = FastAPI()

@app.get('/')

def mehedi():
    return {'data': 'this is mehedi'}

@app.get('/jiniya')

def jiniya():
    return {'data': 'love u jiniya'}

@app.get('/welcome/{name}')

def welcome(name: str):
    return {'welcome': f'{name}'}


@app.get('/roll/{id}')
def roll(id: int, limit : int = 10, ok : bool = True, cry : Optional[str] = None):
    print(f"Received id: {id}, limit: {limit}, cry = {cry}") # ADD THIS LINE
    if limit > 10 and ok == True:
        return   {'error': 'limit is too high'}
    else :
        return {'roll': f'{id}'}

@app.post('/blog')
    
def create_blog(request: blog):
    return {f"'title': request.title, loves 'body': request.body, 'published': request.published"}

