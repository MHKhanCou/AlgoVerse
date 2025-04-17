import models

def checkEmail(email: str) -> bool:
    return True if models.User.get_by_email(email) else False

def checkName(name: str) -> bool:
    return True if models.User.get_by_name(name) else False