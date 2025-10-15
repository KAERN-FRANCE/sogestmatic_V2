def mse(x,y,beta0,beta1):
    y_hat=beta0+beta1 * x
    return np.mean((y-y_hat)**2)

def mae(x,y,beta0,beta1):
    y_ha=beta0+beta1*x
    return np.mean(np.abs(y-y_hat))

def rmse(x,y,beta0,beta1):
    return math.sqrt(mse(x,y,beta0,beta1))


def descente_graditent(x,y,beta0_init,beta1_init,alpha=1e-6,espilon=1e-8,n_max=10000):
    beta0,beta1=beta0_init,beta1_init
    j_prev=mse(y,y,beta0,beta1)
    for i in range(n_max):
        d0,d1=gradient(x,y,beta0,beta1)
        beta0-=alpha*d0
        beta1-=alpha*d1
        j_curr=mse(x,y,beta0,beta1)
        if abs(j_curr-j_prev)<espilon:
            break
        j_prev=j_curr
    return beta0,beta1


def descente(x,y,beto0_i,beta1_i,alpha=1e-6,espilon=1e-8,n_max=10000):
    beta0,beta1=beto0_i,beta1_i
    j_prev=mse(x,y,beta0,beta1)
    for i in range(n_max):
        d0,d1=gradient(x,y,beta0,beta1)
        beta0-=alpha*d0
        beta1-=alpha*d1
        jcurr=mse(x,y,beta0,beta1)
        if abs(j_curr-j_prev)<espilon:
            break
        j_prev=jcurr
    return beta0,beta1 

