import bcrypt

# Replace 'your_new_password' with the desired password
password = 'test123'
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
print('Hashed password:', hashed)