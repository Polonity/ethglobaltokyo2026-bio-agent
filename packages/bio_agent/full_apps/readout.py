"""Small deterministic regression trees for nonlinear neural activity/reward interactions.
Trees see neural features only. Leaves estimate recorded action outcomes, not trading rules.
"""
import numpy as np


def fit_tree(x, y, depth=3, min_leaf=6):
    node={'value':float(np.mean(y)), 'samples':len(y)}
    if depth==0 or len(y)<2*min_leaf: return node
    best_loss=float(np.sum((y-y.mean())**2)); best=None
    for feature in range(x.shape[1]):
        order=np.argsort(x[:,feature],kind='stable'); values=x[order,feature]; target=y[order]
        sums=np.cumsum(target); squares=np.cumsum(target**2)
        for k in range(min_leaf,len(y)-min_leaf+1):
            if values[k-1]==values[k]: continue
            loss=squares[k-1]-sums[k-1]**2/k+squares[-1]-squares[k-1]-(sums[-1]-sums[k-1])**2/(len(y)-k)
            if loss<best_loss-1e-12:
                best_loss=float(loss);best=(feature,float((values[k-1]+values[k])/2),order[:k],order[k:])
    if best:
        feature,threshold,left,right=best
        node.update(feature=feature,threshold=threshold,left=fit_tree(x[left],y[left],depth-1,min_leaf),
                    right=fit_tree(x[right],y[right],depth-1,min_leaf))
    return node


def predict_tree(node, x):
    while 'feature' in node:
        node=node['left'] if x[node['feature']]<=node['threshold'] else node['right']
    return node['value']
